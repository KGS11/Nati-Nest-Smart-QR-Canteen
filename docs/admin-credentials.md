# Nati Nest QR Canteen - Staff Credentials and Roles

This document outlines the default credentials, roles, and password management for Nati Nest staff.

## Default Credentials (Local / Seeding)

During database seeding (`npm run seed` or first setup), the database is populated with the following default administrative user:

- **Phone Number**: `9999999999`
- **Password**: `admin123`
- **Role**: `ADMIN`

## User Roles and Privileges

The application supports three staff roles configured in `schema.prisma`:

1. **`Role.ADMIN`**:
   - Access to Admin Panel dashboard, menu item CRUD operations, user/staff accounts management, daily menu templates, revenue/payment/tips reports, catering lead management, and Excel/CSV exporting.
2. **`Role.KITCHEN`**:
   - Access to Kitchen Board (view incoming, preparing, ready orders; transition order states), and Today's Menu availability controls (marking items out-of-stock/unavailable with reason logging, and restoring items).
3. **`Role.SERVER` (Waiter)**:
   - Access to Waiter Board (view ready orders, mark delivered, resolve assistance/bill requests, record order notes, view live tipping summaries, and view waiter tips reports).

## Password Security

- Passwords are encrypted in the database using **BCryptJS** (`bcryptjs`).
- Passwords should be updated immediately after the first login via the Staff Management portal under the Admin Dashboard.
- When creating new staff, the admin assigns the initial password which the staff can change later.
