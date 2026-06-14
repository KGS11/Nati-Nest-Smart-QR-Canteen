import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { AssistanceRequest, Order, PendingPayment } from "@/types/domain";
import { PaymentMethod } from "@/types";

export const serverService = {
  async getReadyOrders() {
    const response = await apiClient.get<ApiResponse<{ orders: Order[]; count: number }>>(
      "/server/orders/ready",
    );
    return response.data.data;
  },

  async markDelivered(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/server/orders/${orderId}/deliver`,
    );
    return response.data.data.order;
  },

  async claimDelivery(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/server/orders/${orderId}/claim`,
    );
    return response.data.data.order;
  },

  async releaseDelivery(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/server/orders/${orderId}/release`,
    );
    return response.data.data.order;
  },

  async getAssistanceRequests() {
    const response = await apiClient.get<ApiResponse<AssistanceRequest[]>>("/server/assistance");
    return response.data.data;
  },

  async resolveAssistance(requestId: string) {
    const response = await apiClient.patch<ApiResponse<AssistanceRequest>>(
      `/server/assistance/${requestId}/resolve`,
    );
    return response.data.data;
  },

  async getPendingPayments() {
    const response = await apiClient.get<ApiResponse<{ payments: PendingPayment[]; count: number }>>(
      "/payments/pending",
    );
    return response.data.data.payments;
  },

  async verifyPayment(paymentId: string, paymentMethod: PaymentMethod) {
    const response = await apiClient.patch<ApiResponse<PendingPayment>>(
      `/payments/${paymentId}/verify`,
      { paymentMethod },
    );
    return response.data.data;
  },
};
