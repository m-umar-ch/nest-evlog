# nest-evlog

A **pnpm / yarn monorepo** that demonstrates [evlog](https://www.evlog.dev) **wide-event logging** in realistic NestJS setups:

- **HTTP requests** with deeply nested services and helpers (`api`)
- **Cron + queue producers** without HTTP request scope (`clock`)
- **Background job consumers** (`worker`)

Three apps run on different ports, share **Redis + BullMQ** only (no Nest microservices).

## Quick start

```bash
docker compose up -d          # Redis on :6379
pnpm install                  # or: yarn install

# Three terminals
pnpm run start:worker         # :3003 — start first
pnpm run start:clock          # :3002
pnpm run start:api            # :3000
```

**yarn** (from repo root):

```bash
yarn workspace @nest-evlog/worker start:dev
yarn workspace @nest-evlog/clock start:dev
yarn workspace @nest-evlog/api start:dev
```

Watch each terminal for wide events tagged by service name.

## Applications

| App | Default port | evlog `service` | Responsibility |
|-----|----------------|-----------------|----------------|
| **api** | 3000 | `nest-evlog-api` | GraphQL API (code-first) + checkout |
| **clock** | 3002 | `nest-evlog-clock` | Crons + BullMQ enqueue (producer) |
| **worker** | 3003 | `nest-evlog-worker` | BullMQ job processors (consumer) |

```bash
PORT=3001 pnpm run start:api    # override any app port
```

## How evlog is used

### One wide event per unit of work

| Unit of work | App | Mechanism |
|--------------|-----|-----------|
| HTTP request | api, clock | `EvlogModule` + `useLogger().set()` |
| Cron tick | clock | `runWithJobLogger()` → `createLogger()` |
| Enqueue operation | clock | `runWithJobLogger()` (nested under cron or HTTP) |
| BullMQ job | worker | `runWithJobLogger()` per `process()` call |

### HTTP (api + clock triggers)

```typescript
const log = useLogger();
log.set({ checkout: { userId: 'usr_alice' } });
// … nested services also call useLogger() — same event
```

Emitted when the HTTP response finishes (or on error via `EvlogExceptionFilter`).

### Background (clock crons, worker jobs)

```typescript
await runWithJobLogger({ operation: 'job.order_sync', correlationId }, async (log) => {
  log.set({ job: { userId } });
  // … helpers call setJobStep(log, 'merge_local_state')
});
// emits one wide event: outcome success | failure
```

### Correlation across apps

Jobs carry a `correlationId`. Search logs to trace producer → consumer:

```
INFO [nest-evlog-clock]  enqueue.order_sync   correlationId=corr_abc …
INFO [nest-evlog-worker] job.order_sync       correlationId=corr_abc …
```

### Passing API wide-event context to the worker

The worker runs in a **separate process**, so it cannot call `useLogger()` from the API request. Instead, the API **snapshots** the in-flight wide event at enqueue time and stores it on the BullMQ job:

1. During the `checkout` mutation, services call `useLogger().set()` (user, checkout, order, payment, …).
2. Before enqueue, `captureProducerWideEvent(log, { service: 'nest-evlog-api', … })` calls `log.getContext()` and copies fields into `job.data.producer`.
3. The worker starts its job logger with `buildJobLoggerInitialContext()`, which sets:
   - `_parentRequestId` — same correlation field evlog uses for `log.fork()` children
   - `producer` — metadata (service, method, path)
   - `parentEvent` — full API context snapshot (user, checkout, order, pricing, …)

**Three related wide events** for one checkout:

| # | Service | Event | Notes |
|---|---------|-------|-------|
| 1 | `nest-evlog-api` | `POST /graphql` (`checkout`) | HTTP request completes |
| 2 | `nest-evlog-api` | `enqueue_post_checkout` | Optional `log.fork()` child on API |
| 3 | `nest-evlog-worker` | `job.post_checkout` | Includes `parentEvent` from API |

Clock HTTP triggers use the same pattern (`captureProducerWideEvent` on `/trigger/*`).

Docs: [NestJS integration](https://www.evlog.dev/integrate/frameworks/nestjs) · [Wide events](https://www.evlog.dev/learn/wide-events)

## Monorepo layout

```
apps/
  api/                 # Checkout API (nested modules + helpers)
  clock/               # @nestjs/schedule + BullMQ producer
  worker/              # BullMQ processors
libs/
  queues/              # Queue names, payloads, Redis config, failure helpers
  job-logging/         # runWithJobLogger(), setJobStep()
scripts/
  build-libs.cjs       # Compiles libs before clock/worker start
docker-compose.yml     # Redis
```

**Do not commit** `dist/`, `node_modules/`, or `.pnpm-store/` — they are gitignored. Run `pnpm run build` or let `prestart:dev` build libs locally.

## BullMQ queues

| Queue | Clock (cron + trigger) | Worker processor |
|-------|------------------------|------------------|
| `order-sync` | Every 1 min | `OrderSyncProcessor` |
| `inventory-alert` | Every 2 min | `InventoryAlertProcessor` |
| `notification-dispatch` | Every 5 min | `NotificationDispatchProcessor` |
| `post-checkout` | **API** after `checkout` mutation | `PostCheckoutProcessor` (includes API `parentEvent`) |

Clock registers queues and **adds** jobs. API only enqueues `post-checkout`. Worker registers the same queues and **processes** jobs. Connection via `REDIS_HOST` / `REDIS_PORT` or `REDIS_URL`.

## API reference

### api — GraphQL at `http://localhost:3000/graphql`

Code-first schema (`@nestjs/graphql` + Apollo). Playground: **http://localhost:3000/graphql** (GraphiQL).

| Operation | Type | Description |
|-----------|------|-------------|
| `health` | Query | `{ health { status } }` |
| `user(id)` | Query | User by ID |
| `order(id)` | Query | Order by ID (after checkout) |
| `checkout(input)` | Mutation | Full checkout pipeline + post-checkout job |

Auto-generated schema file: `apps/api/src/schema.gql` (on build/start).

**Sample users:** `usr_alice` (pro), `usr_bob` (free), `usr_carol` (enterprise)

**Sample SKUs:** `sku_keyboard`, `sku_monitor`, `sku_headset`, `sku_webcam` (out of stock)

### clock — `localhost:3002`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health |
| `POST` | `/trigger/order-sync` | Enqueue order-sync job |
| `POST` | `/trigger/inventory-alert` | Enqueue inventory alert |
| `POST` | `/trigger/notification` | Enqueue notification |

Optional body field: `"fail": "enqueue" | "worker"` (see [Simulated failures](#simulated-failures)).

### worker — `localhost:3003`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health only — jobs run via BullMQ |

## Testing

### api — GraphQL (curl)

```bash
# Health
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ health { status } }"}'

# User
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ user(id: \"usr_alice\") { id name plan loyaltyPoints } }"}'

# Checkout — wide event on POST /graphql + post-checkout job (needs worker + Redis)
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($input: CheckoutInput!) { checkout(input: $input) { orderId transactionId totalCents asyncJob { correlationId queue } } }",
    "variables": {
      "input": {
        "userId": "usr_alice",
        "items": [
          { "sku": "sku_keyboard", "quantity": 1 },
          { "sku": "sku_headset", "quantity": 1 }
        ],
        "card": { "last4": "4242", "brand": "visa", "expiryMonth": 12, "expiryYear": 2030 }
      }
    }
  }'

# Order lookup (use orderId from checkout response)
curl -s -X POST http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ order(id: \"ord_REPLACE\") { id status totalCents } }"}'
```

### api + worker (checkout → post-checkout job)

Start **worker** and **Redis** before running the checkout mutation above.

**Expected logs:**

1. **API** — `POST /graphql` with `graphql.operation=checkout` and full checkout `parentEvent` fields
2. **API** — optional child `enqueue_post_checkout` (`log.fork`)
3. **Worker** — `job.post_checkout` with `_parentRequestId`, `parentEvent` (user, checkout, order, pricing, …)

### clock + worker (happy path)

Start **worker** before **clock**. Then:

```bash
curl -s http://localhost:3002/health

curl -s -X POST http://localhost:3002/trigger/order-sync \
  -H 'Content-Type: application/json' \
  -d '{"userId": "usr_alice"}'

curl -s -X POST http://localhost:3002/trigger/inventory-alert \
  -H 'Content-Type: application/json' \
  -d '{"sku": "sku_webcam", "currentStock": 0}'

curl -s -X POST http://localhost:3002/trigger/notification \
  -H 'Content-Type: application/json' \
  -d '{"userId": "usr_carol"}'
```

**Expected logs (success):**

1. **Clock** — `POST /trigger/order-sync 200` with `route`, `enqueue`
2. **Clock** — `enqueue.order_sync` with `correlationId`, `bullmq`, `outcome: success`
3. **Worker** — `job.order_sync` with same `correlationId`, `steps`, `outcome: success`

Crons enqueue automatically while clock is running (1 min / 2 min / 5 min schedules).

### Simulated failures

Demonstrates **error wide events** with `why` / `fix` from `createError()` and partial `steps` before failure.

| `fail` | Where it fails | What you see |
|--------|----------------|--------------|
| `"enqueue"` | Clock, before Redis | `ERROR` on `enqueue.*` + HTTP `422` on trigger |
| `"worker"` | Worker, mid-job | `ERROR` on `job.*` with partial steps; BullMQ retries once (`attempt: 1`, `2`) |

```bash
# Enqueue rejected in clock
curl -s -X POST http://localhost:3002/trigger/order-sync \
  -H 'Content-Type: application/json' \
  -d '{"fail": "enqueue"}'

# Enqueued; worker fails after merge_local_state
curl -s -X POST http://localhost:3002/trigger/order-sync \
  -H 'Content-Type: application/json' \
  -d '{"fail": "worker"}'

curl -s -X POST http://localhost:3002/trigger/inventory-alert \
  -H 'Content-Type: application/json' \
  -d '{"sku": "sku_webcam", "currentStock": 0, "fail": "worker"}'
```

**Demo IDs** (equivalent to `fail`):

| ID | Effect |
|----|--------|
| `usr_fail_enqueue` | Enqueue failure |
| `usr_fail_worker` | Worker failure (order-sync, notification) |
| `sku_fail` | Worker failure (inventory-alert) |

**Clock — `fail: "enqueue"`** (two ERROR events):

```
ERROR [nest-evlog-clock] enqueue.order_sync
  ├─ steps: build_payload
  ├─ error: message=Enqueue rejected by policy …
  └─ outcome: failure

ERROR [nest-evlog-clock] POST /trigger/order-sync 422
  ├─ route: trigger.order_sync
  └─ error: (same structured error on HTTP event)
```

**Worker — `fail: "worker"`** (per retry attempt):

```
ERROR [nest-evlog-worker] job.order_sync
  ├─ correlationId: corr_xxx
  ├─ attempt: 1
  ├─ job: failureMode=worker
  ├─ steps: fetch_remote_orders → merge_local_state
  ├─ error: message=Job processing failed (simulated) why=Simulated failure after step "merge_local_state" …
  └─ outcome: failure
```

Implementation: `libs/queues` (`assertEnqueueShouldSucceed`, `assertWorkerShouldSucceed`).

## api architecture

```
CheckoutController
  └── CheckoutService
        ├── UsersService
        ├── InventoryService      (+ stock.helper.ts)
        ├── PricingService        (+ discount.helper.ts)
        ├── PaymentsService       (+ card.helper.ts)
        ├── OrdersService         (+ order-status.helper.ts)
        └── NotificationsService  (+ template.helper.ts)
```

Each layer calls `useLogger().set()` — one wide event per `POST /checkout`.

## Environment variables

| Variable | Default | Apps |
|----------|---------|------|
| `PORT` | 3000 / 3002 / 3003 | all |
| `REDIS_HOST` | `localhost` | clock, worker |
| `REDIS_PORT` | `6379` | clock, worker |
| `REDIS_URL` | — | clock, worker (overrides host/port) |

## Scripts (repo root)

| Command | Description |
|---------|-------------|
| `pnpm run start:api` | API dev server |
| `pnpm run start:clock` | Clock dev server (builds libs first) |
| `pnpm run start:worker` | Worker dev server (builds libs first) |
| `pnpm run build` | Build libs + all apps |
| `pnpm run build:api` | Build API only |
| `pnpm run test` | API unit tests |
| `pnpm run test:e2e` | API e2e tests |

## Troubleshooting

### `Cannot find module '.../dist/main'`

Clock/worker expect `apps/<app>/dist/main.js`. Build shared libs first:

```bash
rm -rf apps/clock/dist apps/worker/dist
node scripts/build-libs.cjs
pnpm run start:clock
```

Caused by old `paths` aliases emitting `dist/apps/clock/src/main.js`. Current `tsconfig.build.json` uses `rootDir: ./src`.

### Worker not processing jobs

1. Redis running: `docker compose up -d`
2. Worker started **before** clock enqueues
3. Check worker terminal for connection errors

### No wide events

Ensure you're watching the **process terminal** (not curl output). Each app calls `initLogger()` in `main.ts` with its own `service` name.

## Resources

- [evlog](https://www.evlog.dev)
- [evlog + NestJS](https://www.evlog.dev/integrate/frameworks/nestjs)
- [BullMQ](https://docs.bullmq.io/)
- [NestJS](https://docs.nestjs.com)
