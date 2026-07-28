export type TableStatus = "AVAILABLE" | "OCCUPIED";

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  qrCodeUrl: string | null;
  status: TableStatus;
  createdAt: string;
  activeSessionCount?: number;
  activeAssignment?: {
    sessionId: string;
    waiterId?: string | null;
    waiterName?: string | null;
    kitchenStaffId?: string | null;
    kitchenStaffName?: string | null;
  } | null;
  _count?: {
    sessions: number;
  };
}

export interface TableFormData {
  tableNumber: string;
}

export interface TableSession {
  id: string;
  status: "ACTIVE" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
}
