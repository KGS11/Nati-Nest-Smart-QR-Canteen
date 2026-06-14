# Nati Nest QR Canteen - UPI Payment Settings Configuration

The Nati Nest QR Canteen Management System supports both static and dynamic UPI QR code payments.

## UPI Settings Keys in Database

UPI payments are configured through keys in the `settings` database table. The key names are:

1. **`upi_id`**: The UPI VPA/address of the merchant (e.g., `natinest@okaxis`, `canteen@ybl`).
2. **`business_name`**: The registered business name displayed to the customer during checkout (e.g., `Nati Nest Smart Canteen`).
3. **`upi_qr_url`**: Cloudinary image URL of a static merchant QR code (used as a fallback if `upi_id` is blank or invalid).

## Configuring UPI Payments via Admin Panel

Administrators can configure payment details directly from the Admin Settings Panel:

1. Log in to the Admin Dashboard (default: `/login`).
2. Go to **Settings** -> **Payment Settings**.
3. Fill in the **UPI ID** and **Business Name** fields.
4. (Optional) Upload a static QR code image.
5. Save changes. The system automatically updates the database and regenerates dynamic assets.

## Dynamic UPI QR Code Generation Logic

When a customer checks out and selects "Online Payment", the backend dynamically aggregates the total bill:

$$\text{Checkout Amount} = \text{Order Items Subtotal} + \text{Selected Tip Amount}$$

If `upi_id` is configured:
- The system generates a standard UPI deep-link URL:
  `upi://pay?pa={upi_id}&pn={business_name}&am={amount}&cu=INR`
- The system renders this URL into a high-quality QR code (as a PNG data URL) using the `qrcode` library on the server side.
- Tapping the QR code on a mobile device deep-links directly into installed payment apps (GPay, PhonePe, Paytm) pre-filling the exact amount and merchant details.

If only `upi_qr_url` is configured:
- The system displays the static uploaded QR code image as a fallback.
