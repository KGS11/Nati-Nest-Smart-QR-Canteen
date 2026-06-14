export interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions: string | null;
  status: "ACTIVE" | "REJECTED";
}

export interface KitchenOrder {
  id: string;
  status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY";
  tableNumber: string;
  placedAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  items: KitchenOrderItem[];
  subtotal: number;
  specialNotes?: string | null;
  assignedKitchenId?: string | null;
  assignedKitchenName?: string | null;
}

export interface KitchenColumnData {
  title: string;
  status: KitchenOrder["status"][];
  orders: KitchenOrder[];
  accentColor: string;
  emptyMessage: string;
}

export interface OrderNewSocketPayload {
  orderId: string;
  sessionId: string;
  tableNumber: string;
  placedAt: string;
  itemCount: number;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  status: KitchenOrder["status"] | "DELIVERED" | "PAID" | "CANCELLED";
  tableNumber: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  tableNumber: string;
  cancelledAt: string;
}
