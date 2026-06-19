export enum Role {
  ADMIN = "ADMIN",
  KITCHEN = "KITCHEN",
  SERVER = "SERVER",
}

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
}

export enum SessionStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export enum OrderStatus {
  PLACED = "PLACED",
  ACCEPTED = "ACCEPTED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum OrderItemStatus {
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
}

export enum PaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

export enum AssistanceType {
  WATER = "WATER",
  BILL = "BILL",
  GENERAL = "GENERAL",
  PLATE = "PLATE",
}

export enum AssistanceStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

export interface TableSession {
  id: string;
  tableId: string;
  status: SessionStatus;
  openedAt: string;
  closedAt: string | null;
}
