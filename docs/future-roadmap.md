# Nati Nest QR Canteen - Future Roadmap

This roadmap documents recommendations for future technical backlog improvements, feature expansions, and business scale enhancements.

---

## 1. P0 Blockers & Critical Improvements (Maintenance)

*   **Multi-Waiter Ownership Enhancements**:
    *   *Goal*: Strengthen the waiter-order assignment model. Ensure only the specific waiter who claimed the food delivery or took a table's assistance requests can verify that table's payment, unless overridden by an Admin.
*   **Multi-Kitchen Ownership Enhancements**:
    *   *Goal*: Support sorting of food preparation columns by category (e.g. *Main Course* vs *Beverages*) so separate kitchen stations (beverage counter, hot station) only see items they are responsible for.

---

## 2. P1 Operational Features (Recommended)

*   **GST Billing Support**:
    *   *Goal*: Incorporate CGST and SGST itemization calculations on the customer bill and admin reports.
*   **WhatsApp / SMS Notifications**:
    *   *Goal*: Push SMS or WhatsApp updates to customers when their order status is accepted or marked ready for pick-up.
*   **Catering Lead Workflow**:
    *   *Goal*: Build an inline email responder or WhatsApp link in the Admin panel to contact catering leads directly.

---

## 3. P2 Value-Add Enhancements (Nice-to-Have)

*   **Inventory & Stock Management**:
    *   *Goal*: Link recipes to menu items. Deduct ingredients automatically from inventory stock when orders are placed, triggering alerts when ingredients run low.
*   **Customer Loyalty Program**:
    *   *Goal*: Record customer phone numbers to award loyalty points for repeat visits, offering discounts during checkout.

---

## 4. P3 Long-Term Expansions (Strategic)

*   **Multi-Branch Support**:
    *   *Goal*: Scale the database schema to handle multiple physical branches. Allow owners to view consolidated revenue reports and switch branch dashboards seamlessly.
*   **Mobile App Development**:
    *   *Goal*: Build dedicated native Android and iOS apps for staff to handle waiter and kitchen duties with native push notifications.
