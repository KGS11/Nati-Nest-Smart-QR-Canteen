import { AssistanceStatus, AssistanceType, OrderStatus, PaymentMethod, PaymentStatus, TableStatus } from "@/types";

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: MenuCategory;
  isVegetarian?: boolean;
  isPopular?: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  specialInstructions?: string | null;
  status?: string;
  menuItem: MenuItem;
  rejectionReason?: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  placedAt: string;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  subtotal?: number;
  session: {
    id: string;
    table: {
      tableNumber: string;
    };
  };
  items: OrderItem[];
  rejectionReason?: string | null;
  assignedKitchenId?: string | null;
  assignedKitchenName?: string | null;
  assignedWaiterId?: string | null;
  assignedWaiterName?: string | null;
  assignedAt?: string | null;
  deliveredBy?: string | null;
}

export interface DashboardSummary {
  today: {
    revenue: number;
    orders: number;
    newSessions: number;
    feedbackCount: number;
    avgRating: number;
  };
  liveStatus: {
    activeSessions: number;
    occupiedTables: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    pendingPayments: number;
    pendingAssistanceRequests: number;
  };
  thisWeek: {
    revenue: number;
    orders: number;
    newSessions: number;
  };
  allTime: {
    totalRevenue: number;
    totalOrders: number;
    totalSessions: number;
    totalMenuItems: number;
    totalTables: number;
    totalFeedback: number;
    overallAvgRating: number;
  };
  generatedAt: string;
}

export interface PopularItem {
  rank: number;
  menuItemId: string;
  name: string;
  categoryName: string;
  totalQuantitySold: number;
  totalOrders: number;
  totalRevenue: number;
  isAvailable: boolean;
}

export interface TableRecord {
  id: string;
  tableNumber: string;
  status: TableStatus;
  capacity?: number;
  qrCodeUrl?: string | null;
}

export interface AssistanceRequest {
  id: string;
  requestType: AssistanceType;
  status: AssistanceStatus;
  createdAt: string;
  session: {
    id: string;
    table: {
      tableNumber: string;
    };
  };
}

export interface PendingPayment {
  id: string;
  sessionId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  session?: {
    table?: {
      tableNumber: string;
    };
  };
}

export type CateringLeadStatus = "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST";

export interface CateringLead {
  id: string;
  sessionId?: string | null;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  location: string;
  notes?: string | null;
  preferredContactTime?: string | null;
  status: CateringLeadStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}
