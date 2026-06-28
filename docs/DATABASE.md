# Database

The database is PostgreSQL managed by Prisma. The source of truth is `backend/prisma/schema.prisma`.

## Prisma Setup

```text
datasource db: postgresql
generator client: prisma-client-js
```

Commands:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Core Models

| Model | Purpose |
| --- | --- |
| `User` | Admin, kitchen, and server staff accounts |
| `RefreshToken` | Staff refresh token rotation and revocation |
| `RestaurantTable` | Physical tables and QR identifiers |
| `MenuCategory` | Menu grouping and ordering |
| `MenuItem` | Sellable items, prices, images, availability |
| `TableSession` | Active customer session for a table |
| `Order` | Customer order header and status |
| `OrderItem` | Individual ordered menu items |
| `Payment` | Bill amount, tip, method, status, verifier |
| `AssistanceRequest` | Customer help, bill, water, plate requests |
| `Feedback` | Customer rating and comment |
| `CateringLead` | Catering enquiry pipeline |
| `Settings` | Business and payment settings |
| `DailyMenu` | Daily availability/removal tracking |
| `OrderAssignmentHistory` | Kitchen/server assignment audit trail |
| `WaiterAssignmentRequest` | Waiter assignment coordination |

## Key Enums

- `Role`: `ADMIN`, `KITCHEN`, `SERVER`
- `TableStatus`: `AVAILABLE`, `OCCUPIED`
- `SessionStatus`: `ACTIVE`, `CLOSED`
- `OrderStatus`: `PLACED`, `ACCEPTED`, `PREPARING`, `READY`, `PREPARED`, `DELIVERED`, `PAID`, `CANCELLED`
- `OrderItemStatus`: `ACTIVE`, `REJECTED`
- `PaymentMethod`: `CASH`, `UPI`
- `PaymentStatus`: `PENDING`, `COMPLETED`
- `AssistanceType`: `WATER`, `BILL`, `GENERAL`, `PLATE`
- `AssistanceStatus`: `PENDING`, `RESOLVED`
- `CateringLeadStatus`: `NEW`, `CONTACTED`, `QUOTED`, `WON`, `LOST`
- `DailyMenuRemovalReason`: `OUT_OF_STOCK`, `INGREDIENT_FINISHED`, `MACHINE_PROBLEM`, `KITCHEN_CLOSED`, `OTHER`
- `AssignmentStatus`: `PENDING`, `ACCEPTED`, `EXPIRED`

## Important Relationships

- A `RestaurantTable` has many `TableSession` records.
- A `TableSession` has many `Order`, `Payment`, `AssistanceRequest`, and `Feedback` records.
- An `Order` has many `OrderItem` records.
- `OrderItem` references both `Order` and `MenuItem`.
- `Payment` references the verifying `User` when payment is confirmed.
- Assignment history links orders to staff users.

## Indexing

The schema includes indexes for common operational queries:

- Staff lookup by phone and role.
- Refresh token lookup and user indexes.
- Table QR and table number uniqueness.
- Menu category, availability, and popular item filters.
- Active session lookup by table/status.
- Order filtering by session, status, timestamps, assignment, and order number.
- Payment status/session indexes.
- Assistance status/type indexes.
- Feedback rating/date indexes.
- Catering status/date indexes.
- Daily menu date/item indexes.

## Production Concerns

- Keep Prisma migrations committed and apply with `prisma migrate deploy`.
- Use managed PostgreSQL backups or scheduled `pg_dump` backups.
- Use connection pooling or conservative connection limits for small database plans.
- Avoid editing production data directly; prefer admin UI or audited scripts.
- Restore drills are required before handover.

