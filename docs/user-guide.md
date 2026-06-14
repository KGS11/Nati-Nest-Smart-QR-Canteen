# Nati Nest QR Canteen - User Guide

This guide explains how to operate the Nati Nest QR Canteen Management System across different roles.

---

## 1. Customer User Guide

### Accessing the Canteen Menu
1. **QR Scan**: Scan the QR code located on your dining table. This automatically opens the canteen web app, recognizes your table number, and initializes your dining session.
2. **Manual Entry**: If your camera cannot scan the QR, navigate to the homepage and click **Customer Menu**. A glassmorphic window will prompt you to type in your table number manually. Once submitted, it initiates your session.

### Ordering Items
1. Browse categories (Snacks, Beverages, Meals) using the category bar.
2. Click **Add** on any menu item to add it to your cart.
3. Open the **Cart Drawer** using the float button at the bottom of the screen.
4. Adjust quantities using `+` or `-` buttons, or remove items.
5. (Optional) Write item-level special instructions (e.g., "sugar-free", "extra spicy") in the inputs.
6. Click **Place Order** and confirm. You will be redirected to the **Order Tracking** screen, where you can watch the state move from Placed to Preparing and Ready in real-time.

### Requesting Assistance
- Tap the **Call Waiter** option on the bottom navigation menu or cart. Select the assistance type (Water, Bill, General) to notify the waiter.

### Paying the Bill
1. Tap **Pay Bill** on the navigation bar.
2. Select your payment method:
   - **Cash**: Select optional tip (₹10, ₹20, ₹50, or Custom), proceed, and tap **Notify Waiter**. Wait for the waiter to collect the cash and confirm.
   - **Online (UPI)**: Select tip. The system generates a dynamic QR code pre-filled with the exact total. Scan or tap to open your GPay/Paytm app. Once paid, click **I Have Paid** to alert the waiter for confirmation.
3. After the waiter verifies the payment, the screen automatically redirects to the **Feedback Page** where you can leave a star/emoji rating.

---

## 2. Kitchen User Guide

The Kitchen Dashboard operates on desktop or tablet devices in the food preparation area.

1. **Incoming Orders**: When a new order arrives, the dashboard flashes red and sounds an audio alert chime.
2. **Accepting Orders**: Click **Accept** on the order card. This moves it to the **Preparing** column.
3. **Food Ready**: When the dish is ready, click **Mark Ready**. This moves it to the **Ready** column and alerts the waiter.
4. **Item Rejections**: If a specific item is out of stock after order placement, the kitchen can click **Reject** on the individual item line and select the reason.
5. **Today's Menu Controls**: Click **Manage Menu** at the top. Cooks can toggle availability (unavailable, restore, or remove item with audit logs) for active daily dishes.

---

## 3. Waiter (Server) User Guide

The Waiter Dashboard is designed to run on mobile or tablet devices carried by wait staff.

1. **Deliveries**: Monitor the **Ready Orders** grid. When a dish is ready, carry it to the table and click **Deliver** to clear it.
2. **Assistance Requests**: View incoming customer requests (Water, Bill, General). Hand over requested items and click **Resolve**. Bill requests are highlighted in red to prioritize payment collection.
3. **Order Notes**: Waiters can append custom instructions (e.g., "VIP Guest", "Rushed Order") to any active order by editing the notes in the bill modal.
4. **Tips Tracker**: View tipping summary statistics (total tips, tips by waiter, daily tips) directly on the Waiter Dashboard.

---

## 4. Admin User Guide

Admins manage the entire canteen configuration:
- **Dashboard Summary**: Monitor live canteen statistics (AOV, occupied tables, live sessions).
- **Master Catalog Management**: Create categories, add new dishes, change base prices, or upload images.
- **Reporting & Exports**: Run revenue, table utilization, catering lead, and tipping reports. Export them directly to Excel/CSV worksheets.
- **Staff Registration**: Manage staff accounts and roles.
