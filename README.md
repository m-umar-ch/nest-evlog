# nest-evlog

A NestJS demo application that shows **wide-event logging** with [evlog](https://www.evlog.dev) across a realistic multi-module codebase: services inject other services, business logic calls standalone helper functions, and every layer contributes context to **one log event per HTTP request**.

## About evlog

Traditional logging often emits many small lines per request (controller started, service called, DB query, etc.). **Wide events** flip that model: you accumulate structured context throughout the request lifecycle, then emit a single rich event when the response completes.

In this app:

- `EvlogModule.forRoot()` registers global middleware that creates a request-scoped logger.
- `useLogger()` from `evlog/nestjs` accesses that logger from **any** depth in the call stack (controllers, services, helpers) via `AsyncLocalStorage` — no need to pass `req` or a logger instance through constructors.
- `log.set({ ... })` merges fields into the current request's event.
- `createError()` produces structured errors with `why`, `fix`, and `link` fields.
- `EvlogExceptionFilter` logs errors into the same wide event and returns a consistent JSON error shape.

Docs: [evlog NestJS integration](https://www.evlog.dev/integrate/frameworks/nestjs)

### Example wide event (checkout)

After `POST /checkout`, the server terminal shows one event with context from every layer:

```
INFO [nest-evlog] POST /checkout 201 in 2ms
  ├─ checkout: userId=usr_alice ... completed=true orderId=ord_...
  ├─ user: name=Alice Chen plan=pro loyaltyPoints=1250
  ├─ inventory: reservations=[...] stockAfter=[...]
  ├─ pricing: subtotal=$289.98 discount=$55.82 total=$253.48
  ├─ payment: card=****-4242 status=authorized transactionId=txn_...
  ├─ order: id=ord_... status=confirmed itemCount=2
  ├─ loyalty: pointsUsed=1250 pointsRemaining=0
  └─ notification: channel=email delivered=true
```

## Architecture

The app models an e-commerce **checkout flow** with in-memory data (no external DB).

```
CheckoutController
  └── CheckoutService          ← orchestrates the full flow
        ├── UsersService       ← validation, loyalty points
        ├── InventoryService   ← stock reservation (+ stock.helper.ts)
        ├── PricingService     ← discounts, tax (+ discount.helper.ts)
        ├── PaymentsService    ← card charge (+ card.helper.ts)
        ├── OrdersService      ← order persistence (+ order-status.helper.ts)
        └── NotificationsService ← confirmation email (+ template.helper.ts)
```

### Project structure

```
src/
├── main.ts                          # initLogger() + global EvlogExceptionFilter
├── app.module.ts                    # EvlogModule.forRoot({ exclude: ['/health'] })
├── health.controller.ts
├── common/
│   ├── filters/evlog-exception.filter.ts
│   └── helpers/                     # id, money, validation
├── users/                           # GET /users/:id
├── inventory/
├── pricing/
├── payments/
├── notifications/
├── orders/                          # GET /orders/:id
└── checkout/                        # POST /checkout
```

### Modules

| Module | Responsibility |
|--------|----------------|
| **UsersModule** | User lookup, checkout eligibility, loyalty points |
| **InventoryModule** | Product stock and reservations |
| **PricingModule** | Plan, bulk, and loyalty discounts + tax |
| **PaymentsModule** | Card validation and authorization |
| **OrdersModule** | Order creation and status |
| **NotificationsModule** | Order confirmation messages |
| **CheckoutModule** | End-to-end checkout orchestration |

## Getting started

```bash
pnpm install
pnpm run start:dev
```

Default port is **3000**. Override with:

```bash
PORT=3001 pnpm run start:dev
```

Build for production:

```bash
pnpm run build
pnpm run start:prod
```

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (excluded from evlog) |
| `GET` | `/users/:id` | Fetch user by ID |
| `POST` | `/checkout` | Run full checkout pipeline |
| `GET` | `/orders/:id` | Fetch order by ID |

### Sample data

**Users**

| ID | Name | Plan |
|----|------|------|
| `usr_alice` | Alice Chen | pro |
| `usr_bob` | Bob Martinez | free |
| `usr_carol` | Carol Nguyen | enterprise |

**Products (SKU)**

| SKU | Name | Notes |
|-----|------|-------|
| `sku_keyboard` | Mechanical Keyboard | In stock |
| `sku_monitor` | 4K Monitor | In stock |
| `sku_headset` | Wireless Headset | In stock |
| `sku_webcam` | HD Webcam | **Out of stock** (triggers 409) |

**Payment test cases**

- `last4: "4242"` — succeeds
- `last4: "0000"` — declined (402)

## Testing with curl

Replace the host/port if needed (`localhost:3000` by default, or `3001` if you set `PORT=3001`).

### Health (not logged by evlog)

```bash
curl -s http://localhost:3000/health
```

### Get user — simple wide event

```bash
curl -s http://localhost:3000/users/usr_alice
```

### Successful checkout — full pipeline wide event

```bash
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
```

Use the returned `orderId` to fetch the order:

```bash
curl -s http://localhost:3000/orders/ord_REPLACE_ME
```

### Enterprise user with bulk discount (3 items)

```bash
curl -s -X POST http://localhost:3000/checkout \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "usr_carol",
    "items": [
      { "sku": "sku_keyboard", "quantity": 1 },
      { "sku": "sku_monitor", "quantity": 1 },
      { "sku": "sku_headset", "quantity": 1 }
    ],
    "card": {
      "last4": "4242",
      "brand": "mastercard",
      "expiryMonth": 6,
      "expiryYear": 2028
    }
  }'
```

### Out of stock — structured 409 error in wide event

```bash
curl -s -X POST http://localhost:3000/checkout \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "usr_bob",
    "items": [{ "sku": "sku_webcam", "quantity": 1 }],
    "card": {
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2030
    }
  }'
```

### Payment declined — structured 402 error

```bash
curl -s -X POST http://localhost:3000/checkout \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "usr_alice",
    "items": [{ "sku": "sku_keyboard", "quantity": 1 }],
    "card": {
      "last4": "0000",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2030
    }
  }'
```

### User not found — 404

```bash
curl -s http://localhost:3000/users/usr_unknown
```

Watch the **server terminal** (not the curl output) to see evlog wide events and error context after each request.

## How logging is wired

1. **`src/main.ts`** — calls `initLogger({ env: { service: 'nest-evlog' } })` before bootstrap.
2. **`src/app.module.ts`** — imports `EvlogModule.forRoot({ exclude: ['/health'] })`.
3. **Services & helpers** — call `useLogger().set({ ... })` to add context at each step.
4. **`EvlogExceptionFilter`** — registered globally; captures errors into the wide event via `useLogger().error(error)`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run start:dev` | Dev server with watch |
| `pnpm run build` | Compile to `dist/` |
| `pnpm run start:prod` | Run compiled app |
| `pnpm run test` | Unit tests |
| `pnpm run test:e2e` | E2E tests |
| `pnpm run lint` | ESLint |

## Resources

- [evlog documentation](https://www.evlog.dev)
- [evlog NestJS guide](https://www.evlog.dev/integrate/frameworks/nestjs)
- [NestJS documentation](https://docs.nestjs.com)
