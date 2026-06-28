# API Reference

Base path: `/api`

Request validation uses Zod. Protected staff endpoints require `Authorization: Bearer <staffAccessToken>`. Customer endpoints require the customer session token created by QR scan.

## Authentication

Mounted at `/api/auth`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/login` | Public | Staff login with phone and password |
| POST | `/refresh` | Refresh token | Rotate staff refresh token and issue new access token |
| POST | `/logout` | Refresh token | Revoke one refresh token |
| POST | `/logout-all` | Staff | Revoke all user refresh tokens |
| GET | `/me` | Staff | Return current staff user |

Login body:

```json
{
  "phone": "9999999999",
  "password": "Admin@123"
}
```

## Categories

Mounted at `/api/categories`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Optional | List categories |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

## Menu

Mounted at both `/api/menu` and `/api/menu-items`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | List menu items |
| POST | `/` | Admin | Create menu item with optional image upload |
| PUT | `/:id` | Admin | Update menu item with optional image upload |
| PATCH | `/:id/availability` | Admin | Toggle availability |
| PATCH | `/admin/items/:id/popular` | Admin | Toggle popular flag |
| DELETE | `/:id` | Admin | Delete menu item |

## Tables

Mounted at `/api/tables`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/by-number/:tableNumber` | Public | Resolve table by number |
| GET | `/` | Admin | List tables |
| GET | `/:id` | Admin | Get table |
| POST | `/` | Admin | Create table |
| PUT | `/:id` | Admin | Update table |
| PATCH | `/:id/qr` | Admin | Regenerate QR token |
| PATCH | `/:id/status` | Admin | Update table status |
| DELETE | `/:id` | Admin | Delete table |

## Customer

Mounted at `/api/customer`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/scan/:tableId` | Public | Create or resume active table session |
| GET | `/session` | Customer session | Current customer session |
| GET | `/menu` | Customer session | Customer menu |
| POST | `/assistance` | Customer session | Create assistance request |
| GET | `/bill` | Customer session | Get current bill |

## Customer Orders

Mounted at `/api/customer/orders`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | Customer session | Place order |
| GET | `/` | Customer session | List current session orders |
| GET | `/:orderId` | Customer session | Get order details |
| PATCH | `/:orderId/cancel` | Customer session | Cancel only `PLACED` order |

Order body:

```json
{
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "specialInstructions": "Less spicy"
    }
  ],
  "specialNotes": "Serve together"
}
```

Prices are calculated by the backend from `MenuItem.price`; frontend prices are not trusted.

## Kitchen

Mounted at `/api/kitchen`. Requires `KITCHEN` or `ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/orders` | List active kitchen orders |
| GET | `/orders/:orderId` | Get kitchen order detail |
| PATCH | `/orders/:orderId/accept` | Accept placed order |
| PATCH | `/orders/:orderId/accept-and-prepare` | Accept and move to preparing |
| PATCH | `/orders/:orderId/preparing` | Mark preparing |
| PATCH | `/orders/:orderId/ready` | Mark ready |
| PATCH | `/orders/:orderId/prepared` | Mark prepared |
| PATCH | `/orders/:orderId/release` | Release kitchen assignment |
| PATCH | `/orders/:orderId/reject` | Reject order |
| PATCH | `/orders/:orderId/items/:itemId/reject` | Reject item |

## Server

Mounted at `/api/server`. Requires `SERVER` or `ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/orders/ready` | Ready orders |
| GET | `/orders/in-progress` | Server in-progress orders |
| PATCH | `/orders/:orderId/claim` | Claim order |
| PATCH | `/orders/:orderId/release` | Release order |
| PATCH | `/orders/:orderId/deliver` | Mark delivered |
| PATCH | `/orders/:orderId/notes` | Update server notes |
| GET | `/assistance` | Assistance requests |
| PATCH | `/assistance/:requestId/resolve` | Resolve assistance |
| GET | `/sessions/:sessionId/bill` | Session bill |
| POST | `/assignment/:requestId/accept` | Accept waiter assignment |
| GET | `/my-tables` | Assigned tables |
| GET | `/assignment-requests` | Pending assignment requests |

## Payments

Mounted at `/api/payments`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/request-bill` | Customer session | Request bill/payment |
| POST | `/tip` | Customer session | Set tip amount |
| GET | `/status` | Customer session | Get payment status |
| GET | `/pending` | Server/Admin | List pending payments |
| PATCH | `/:paymentId/verify` | Server/Admin | Verify payment |

Verify body:

```json
{
  "paymentMethod": "CASH"
}
```

## Feedback

Mounted at `/api/feedback`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | Feedback/customer session | Submit feedback |
| GET | `/status` | Feedback/customer session | Feedback status |
| GET | `/` | Admin | List feedback |

## Reports

Mounted at `/api/reports`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/tips` | Admin/Server | Tip report |
| GET | `/dashboard` | Admin | Dashboard KPIs |
| GET | `/waiter-performance` | Admin | Waiter performance |
| GET | `/kitchen-performance` | Admin | Kitchen performance |
| GET | `/export/:type` | Admin | Export reports |
| GET | `/revenue` | Admin | Revenue grouped by day/week/month |
| GET | `/orders` | Admin | Order analytics |
| GET | `/popular-items` | Admin | Popular items |
| GET | `/tables` | Admin | Table-wise report |
| GET | `/feedback` | Admin | Feedback analytics |

## Settings

Mounted at `/api/settings`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Admin | Get settings |
| PUT | `/` | Admin | Update settings |
| GET | `/upi-qr` | Public | Static UPI QR |
| GET | `/upi-qr-dynamic` | Customer session | Dynamic UPI QR |
| POST | `/upi-qr` | Admin | Upload UPI QR image |
| POST | `/logo` | Admin | Upload logo image |

## Staff

Mounted at `/api/staff`. Requires `ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List staff |
| POST | `/` | Create staff |
| PUT | `/:id` | Update staff |
| PATCH | `/:id/status` | Update active status |
| PATCH | `/:id/toggle` | Toggle active status |

## Daily Menu

Mounted at `/api/daily-menu`. Requires `ADMIN` or `KITCHEN` unless noted.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/today` | Admin/Kitchen | Today menu |
| GET | `/full` | Admin/Kitchen | Full daily menu |
| POST | `/add` | Admin/Kitchen | Add menu item to today |
| DELETE | `/remove/:menuItemId` | Admin/Kitchen | Remove item for reason |
| GET | `/removed` | Admin/Kitchen | Removed items |
| POST | `/restore/:dailyMenuId` | Admin/Kitchen | Restore item |
| POST | `/copy-yesterday` | Admin | Copy yesterday menu |
| GET | `/history/:date` | Admin | Historical daily menu |

## Catering

Mounted at `/api/catering`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/leads` | Customer/feedback session | Create catering lead |
| POST | `/enquiries` | Customer/feedback session | Create catering enquiry |
| GET | `/leads` | Admin | List leads |
| GET | `/enquiries` | Admin | List enquiries |
| GET | `/leads/export` | Admin | Export leads |
| GET | `/enquiries/export` | Admin | Export enquiries |
| GET | `/leads/:id` | Admin | Lead details |
| GET | `/enquiries/:id` | Admin | Enquiry details |
| PATCH | `/leads/:id/status` | Admin | Update lead status |
| PATCH | `/enquiries/:id/status` | Admin | Update enquiry status |

## Admin Assignment Controls

Mounted at `/api/admin`. Requires `ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| PATCH | `/orders/:orderId/reassign-kitchen` | Reassign kitchen staff |
| PATCH | `/orders/:orderId/reassign-waiter` | Reassign waiter/server |
| PATCH | `/orders/:orderId/force-unclaim-kitchen` | Force release kitchen claim |
| PATCH | `/orders/:orderId/force-unclaim-waiter` | Force release waiter claim |
| PATCH | `/orders/:orderId/force-deliver` | Force deliver |
| GET | `/orders/:orderId/assignment-history` | Order assignment history |

## Error Format

Application errors are returned with sanitized user-facing messages. Rate-limited requests return HTTP `429` and include retry information where supported by the middleware/proxy.

