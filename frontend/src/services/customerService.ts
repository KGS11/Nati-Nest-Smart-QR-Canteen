import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { AssistanceType } from "@/types";
import { MenuCategory, Order } from "@/types/domain";
import { CartItem } from "@/stores/cartStore";

export interface CustomerSessionDetails {
  id: string;
  tableId: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  totalAmount: number;
  itemCount: number;
  orders: Order[];
  table: {
    tableNumber: string;
  };
}

export interface BillSummary {
  tableNumber: string;
  totalAmount: number;
  itemBreakdown: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface FeedbackStatus {
  submitted: boolean;
  feedback: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
  } | null;
}

export interface PaymentStatusPayload {
  payment: {
    id: string;
    totalAmount: number;
    status: string;
    paymentMethod?: string;
    verifiedAt?: string | null;
  } | null;
}

export interface CateringLeadPayload {
  name: string;
  phone: string;
  eventType: "CORPORATE" | "BIRTHDAY" | "WEDDING" | "SPORTS" | "OTHER";
  eventDate: string;
  guestCount: number;
  location: string;
  notes?: string;
  preferredContactTime?: "MORNING" | "AFTERNOON" | "EVENING";
}

export const customerService = {
  async getMenu() {
    const response = await apiClient.get<ApiResponse<{ categories: MenuCategory[] }>>(
      "/customer/menu",
    );
    return response.data.data.categories;
  },

  async getSession() {
    const response = await apiClient.get<ApiResponse<CustomerSessionDetails>>("/customer/session");
    return response.data.data;
  },

  async requestAssistance(requestType: AssistanceType) {
    const response = await apiClient.post<ApiResponse<unknown>>("/customer/assistance", {
      requestType,
    });
    return response.data;
  },

  async placeOrder(items: CartItem[]) {
    const response = await apiClient.post<ApiResponse<{ order: Order }>>("/customer/orders", {
      items: items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        specialInstructions: item.instructions?.trim() || undefined,
      })),
    });
    return response.data.data.order;
  },

  async getOrders() {
    const response = await apiClient.get<ApiResponse<{ orders: Order[]; count: number }>>(
      "/customer/orders",
    );
    return response.data.data;
  },

  async getOrder(orderId: string) {
    const response = await apiClient.get<ApiResponse<{ order: Order }>>(
      `/customer/orders/${orderId}`,
    );
    return response.data.data.order;
  },

  async cancelOrder(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/customer/orders/${orderId}/cancel`,
    );
    return response.data.data.order;
  },

  async getBill() {
    const response = await apiClient.get<ApiResponse<BillSummary>>("/customer/bill");
    return response.data.data;
  },

  async requestBill() {
    const response = await apiClient.post<
      ApiResponse<{
        payment: {
          id: string;
          totalAmount: number;
          status: string;
        };
        billSummary: BillSummary;
      }>
    >("/payments/request-bill");
    return response.data.data;
  },

  async getPaymentStatus() {
    const response = await apiClient.get<ApiResponse<PaymentStatusPayload>>("/payments/status");
    return response.data.data.payment;
  },

  async getFeedbackStatus() {
    const response = await apiClient.get<ApiResponse<FeedbackStatus>>("/feedback/status");
    return response.data.data;
  },

  async submitFeedback(rating: number, comment?: string) {
    const response = await apiClient.post<
      ApiResponse<{
        feedback: {
          id: string;
          rating: number;
          comment?: string | null;
          createdAt: string;
        };
      }>
    >("/feedback", { rating, comment });
    return response.data;
  },

  async createCateringLead(payload: CateringLeadPayload) {
    const response = await apiClient.post<ApiResponse<{ lead: unknown }>>(
      "/catering/leads",
      payload,
    );
    return response.data.data.lead;
  },
};
