# nest-evlog

A **pnpm monorepo** demonstrating [evlog](https://www.evlog.dev) wide-event logging across three independent NestJS applications:

| App | Port | Role | evlog service name |
|-----|------|------|-------------------|
| **api** | 3000 | HTTP checkout API (nested services + helpers) | `nest-evlog-api` |
| **clock** | 3002 | Cron schedules + BullMQ **producer** | `nest-evlog-clock` |
| **worker** | 3003 | BullMQ **consumer** (job processors) | `nest-evlog-worker` |

Apps are **not** connected via Nest microservices. They share **Redis + BullMQ queue names** only (`libs/queues`).

## About evlog (multi-application)

Each process calls `initLogger({ env: { service: '...' } })` with a **distinct service name**, so terminal output is tagged per app:

```
INFO [nest-evlog-api]    POST /checkout 201 ...
INFO [nest-evlog-clock]  POST /trigger/order-sync 201 ...
INFO [nest-evlog-worker] job.order_sync ...
```

### HTTP apps (api, clock)

- `EvlogModule.forRoot()` — request-scoped logger via middleware
- `useLogger().set({ ... })` — accumulate context in controllers/services

### Background work (clock crons, worker jobs)

- `createLogger()` via `runWithJobLogger()` in `@nest-evlog/job-logging`
- One wide event per **cron tick** or **BullMQ job**
- `correlationId` in job payload links clock enqueue → worker process logs

### Correlation across apps

```
clock enqueue  →  wide event: correlationId=corr_abc, queue=order-sync
worker process →  wide event: correlationId=corr_abc, operation=job.order_sync
```

Search logs by `correlationId` to trace a job from producer to consumer without microservice RPC.

Docs: [evlog NestJS](https://www.evlog.dev/integrate/frameworks/nestjs) · [Wide events](https://www.evlog.dev/learn/wide-events)

## Monorepo layout

```
apps/
  api/          # E-commerce checkout API
  clock/        # @nestjs/schedule crons + BullMQ enqueue
  worker/       # BullMQ processors
libs/
  queues/       # Shared queue names, job payloads, Redis config
  job-logging/  # runWithJobLogger() for cron/job wide events
docker-compose.yml   # Redis for BullMQ
```

### BullMQ queues (shared)

| Queue | Clock (producer) | Worker (consumer) |
|-------|------------------|-------------------|
| `order-sync` | Every 1 min + manual trigger | `OrderSyncProcessor` |
| `inventory-alert` | Every 2 min + manual trigger | `InventoryAlertProcessor` |
| `notification-dispatch` | Every 5 min + manual trigger | `NotificationDispatchProcessor` |

## Prerequisites

- Node.js 20+
- pnpm
- Redis (for clock + worker)

```bash
docker compose up -d    # starts Redis on :6379
pnpm install
```

## Running the apps

Use **three terminals** (or background processes).

**pnpm** (from repo root):

```bash
pnpm run start:api
pnpm run start:clock
pnpm run start:worker
```

**yarn** (from repo root):

```bash
yarn workspace @nest-evlog/api start:dev
yarn workspace @nest-evlog/clock start:dev
yarn workspace @nest-evlog/worker start:dev
```

Clock and worker build shared libs automatically via `prestart:dev` before Nest starts.

Custom ports:

```bash
PORT=3001 pnpm run start:api
PORT=3002 pnpm run start:clock   # default
PORT=3003 pnpm run start:worker  # default
```

Build all:

```bash
pnpm run build
```

## Testing with curl

### API (`localhost:3000`)

```bash
# Health
curl -s http://localhost:3000/health

# User lookup
curl -s http://localhost:3000/users/usr_alice

# Full checkout (wide event across 6 services)
curl -s -X POST http://localhost:3000/checkout \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "usr_alice",
    "items": [
      { "sku": "sku_keyboard", "quantity": 1 },
      { "sku": "sku_headset", "quantity": 1 }
    ],
    "card": {
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2030
    }
  }'

# Out of stock (409 wide event with error)
curl -s -X POST http://localhost:3000/checkout \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "usr_bob",
    "items": [{ "sku": "sku_webcam", "quantity": 1 }],
    "card": { "last4": "4242", "brand": "visa", "expiryMonth": 12, "expiryYear": 2030 }
  }'
```

### Clock (`localhost:3002`) — manual enqueue + evlog

Triggers a **HTTP wide event** (clock) and a **job logger wide event** (enqueue), then worker picks up the job.

```bash
curl -s http://localhost:3002/health

# Enqueue order-sync (watch clock + worker terminals)
curl -s -X POST http://localhost:3002/trigger/order-sync \
  -H 'Content-Type: application/json' \
  -d '{"userId": "usr_alice"}'

# Enqueue inventory alert
curl -s -X POST http://localhost:3002/trigger/inventory-alert \
  -H 'Content-Type: application/json' \
  -d '{"sku": "sku_webcam", "currentStock": 0}'

# Enqueue notification dispatch
curl -s -X POST http://localhost:3002/trigger/notification \
  -H 'Content-Type: application/json' \
  -d '{"userId": "usr_carol"}'
```

Crons also enqueue automatically (order-sync every minute, etc.) when clock is running.

### Worker (`localhost:3003`)

```bash
curl -s http://localhost:3003/health
```

No job triggers here — start worker **before** clock enqueues so jobs are processed immediately. Job wide events appear in the **worker terminal**.

## Example log flow (manual order-sync)

1. **Clock terminal** — HTTP request completes:
   ```
   INFO [nest-evlog-clock] POST /trigger/order-sync 200
     ├─ route: trigger.order_sync
     ├─ trigger: manual
     └─ enqueue: correlationId=corr_xxx jobId=corr_xxx
   ```

2. **Clock terminal** — enqueue operation (nested `runWithJobLogger`):
   ```
   INFO [nest-evlog-clock] enqueue.order_sync
     ├─ correlationId: corr_xxx
     ├─ bullmq: jobId=corr_xxx queue=order-sync
     └─ outcome: success
   ```

3. **Worker terminal** — job processed:
   ```
   INFO [nest-evlog-worker] job.order_sync
     ├─ correlationId: corr_xxx
     ├─ job: userId=usr_alice source=manual
     ├─ steps: fetch_remote_orders → merge_local_state → persist_snapshot
     └─ outcome: success
   ```

## API app architecture

E-commerce checkout with nested services (in-memory data):

```
CheckoutService
  ├── UsersService
  ├── InventoryService (+ stock.helper.ts)
  ├── PricingService (+ discount.helper.ts)
  ├── PaymentsService (+ card.helper.ts)
  ├── OrdersService (+ order-status.helper.ts)
  └── NotificationsService (+ template.helper.ts)
```

Sample users: `usr_alice`, `usr_bob`, `usr_carol`  
Sample SKUs: `sku_keyboard`, `sku_monitor`, `sku_headset`, `sku_webcam` (out of stock)

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `PORT` | 3000 / 3002 / 3003 | Each app |
| `REDIS_HOST` | `localhost` | clock, worker |
| `REDIS_PORT` | `6379` | clock, worker |
| `REDIS_URL` | — | clock, worker (overrides host/port) |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run start:api` | API dev server |
| `pnpm run start:clock` | Clock dev server |
| `pnpm run start:worker` | Worker dev server |
| `pnpm run build` | Build all packages |
| `pnpm run test` | API unit tests |
| `pnpm run test:e2e` | API e2e tests |

## Troubleshooting

### `Cannot find module '.../dist/main'`

This happens when TypeScript emits nested paths like `dist/apps/clock/src/main.js` instead of `dist/main.js` (usually caused by `paths` aliases in `tsconfig.build.json`). This repo builds `libs/queues` and `libs/job-logging` to their own `dist/` folders first, then compiles each app with `rootDir: ./src`.

If you hit this after an old build:

```bash
rm -rf apps/clock/dist apps/worker/dist
node scripts/build-libs.cjs
yarn workspace @nest-evlog/clock start:dev
```

## Resources

- [evlog documentation](https://www.evlog.dev)
- [evlog NestJS guide](https://www.evlog.dev/integrate/frameworks/nestjs)
- [BullMQ](https://docs.bullmq.io/)
- [NestJS](https://docs.nestjs.com)
