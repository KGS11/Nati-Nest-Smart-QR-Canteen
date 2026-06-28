# Operations

This guide is for the person running the system day to day.

## Daily Startup Check

1. Confirm Docker Desktop or the host service manager is running.
2. Check service health:

```bash
docker compose ps
```

3. Open the app URL.
4. Log in as admin.
5. Confirm menu availability, staff accounts, table status, and payment settings.
6. Ask kitchen and server staff to confirm their dashboards show `Live`.

## Common Admin Tasks

| Task | Location |
| --- | --- |
| Add/edit categories | Admin -> Menu -> Categories |
| Add/edit menu items | Admin -> Menu -> Items |
| Toggle availability | Admin menu item controls |
| Manage tables and QR codes | Admin -> Tables |
| Manage staff | Admin -> Staff |
| Configure UPI/business settings | Admin -> Settings |
| View revenue/orders/reports | Admin -> Reports |
| Manage catering enquiries | Admin -> Catering |
| Manage daily menu | Admin -> Daily Menu |

## Kitchen Operations

Kitchen staff use `/kitchen`:

1. Watch incoming orders.
2. Accept new orders.
3. Mark orders preparing.
4. Mark orders ready/prepared.
5. Reject unavailable items with a reason when needed.
6. Keep the tablet connected to power and Wi-Fi.

## Server Operations

Server staff use `/server`:

1. Monitor ready orders.
2. Claim and deliver orders.
3. Resolve assistance requests.
4. Verify cash or UPI payments.
5. Watch priority bill requests.

## Customer Operations

Customers scan a table QR:

1. Session is created for the table.
2. Customer browses menu and adds items.
3. Customer places order.
4. Kitchen/server dashboards update in real time.
5. Customer requests bill.
6. Server verifies payment.
7. Customer submits feedback.

## Troubleshooting

| Symptom | First Check |
| --- | --- |
| Login fails for everyone | Backend health, database URL, seed users, auth rate limit |
| Raw database or connection error | Check backend logs and `DATABASE_URL`; client should receive sanitized message |
| Kitchen does not receive new orders | Socket connection status, backend logs, `/api/customer/orders` success |
| Images do not upload | Cloudinary vars or backend uploads volume |
| Customer cannot scan table | Table exists, QR token/table ID is correct, backend reachable |
| Payment remains pending | Server dashboard verification flow and payment endpoint logs |
| Docker service unhealthy | `docker compose logs <service>` and health endpoint |

## Backup Routine

- Run database backup daily.
- Keep at least 7 daily backups and 4 weekly backups unless storage policy differs.
- Back up uploads if not using Cloudinary.
- Test restore monthly.

