# Nati Nest QR Canteen - Admin User Guide

This guide describes configuration, reporting, exports, and staff management for managers and administrators.

---

## 1. Purpose

The Admin Panel serves as the central management control center for configuring prices, adding/removing employees, reviewing business revenue metrics, and exporting analytical reports.

---

## 2. Common Administrative Tasks

### Staff Management (CRUD)
*   Go to **Staff Management** from the side navigation.
*   **Add Employee**: Click **Add Staff**, enter their name, phone number, choose their role (Admin, Kitchen, Waiter/Server), and set a secure password.
*   **Deactivate Employee**: Toggle the **Active** status. Deactivated staff cannot log into the system.

### Menu Management & Categories
*   Go to **Menu Items** or **Categories**:
    *   **Categories**: Add category groups (e.g. *Beverages*, *Deserts*) and set a sorting index.
    *   **Items**: Create menu items, set descriptions, set prices (utilizing precise decimal storage), upload a food photo, and select a category.

### Reviewing Reports & Analytics
*   Access **Reports** to monitor canteen metrics:
    *   **Revenue**: Displays total sales breakdown by day, week, month, or customized dates.
    *   **Payments**: Review CASH vs UPI splits.
    *   **Tips**: Track total tips earned to facilitate split payouts for floor staff.
    *   **Feedback**: Review customer emoji ratings and written comments.
    *   **Catering Leads**: Access leads submitted via the catering enquiry form.

### Exporting Reports
*   Click **Export to Excel** or **Export to CSV** on any report view.
*   The system generates files with proper UTF-8 BOM encoding so they open in Microsoft Excel without layout distortion.

### System Settings
*   Configure your store's **Business Name**, **Phone Number**, **Address**, **Tax Rates**, and **UPI ID** (VPA address) under the Settings tab.
*   The UPI ID configured here is what generates the dynamic payment QR codes for customers.

---

## 3. Best Practices

*   **VPA Accuracy**: Double-check the **UPI ID** in settings before launching. An incorrect VPA address will prevent customers from completing UPI transfers.
*   **Strong Passwords**: Enforce complex passwords for staff, particularly those assigned the `ADMIN` role.
*   **Deactivate Inactive Staff**: Toggle staff off when they leave the restaurant, keeping logins restricted to current personnel.
