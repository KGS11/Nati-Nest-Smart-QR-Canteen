export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ClientApiError {
  status?: number;
  message: string;
  data?: ApiErrorResponse;
}

export interface StaffUser {
  id: string;
  name: string;
  role: "ADMIN" | "KITCHEN" | "SERVER";
  phone: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  available: boolean;
  isPopular?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  specialInstructions: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: "PLACED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  createdAt: string;
}

export interface BillSummary {
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

export interface AssistanceRequest {
  id: string;
  tableNumber: number;
  type: "WATER" | "BILL" | "HELP" | "PAYMENT";
  createdAt: string;
}

export interface DashboardMetrics {
  totalSales: number;
  ordersToday: number;
  tableTurnovers: number;
  avgFeedbackRating: number;
}

export interface TableRecord {
  id: string;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "NEEDS_ATTENTION";
  activeOrders: number;
  qrUrl: string;
}
