import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { Order } from "@/types/domain";

export interface KitchenOrdersPayload {
  orders: Order[];
  counts: {
    placed: number;
    accepted: number;
    preparing: number;
    total: number;
  };
}

export const kitchenService = {
  async getActiveOrders() {
    const response = await apiClient.get<ApiResponse<KitchenOrdersPayload>>("/kitchen/orders");
    return response.data.data;
  },

  async acceptOrder(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/kitchen/orders/${orderId}/accept`,
    );
    return response.data.data.order;
  },

  async startPreparing(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/kitchen/orders/${orderId}/preparing`,
    );
    return response.data.data.order;
  },

  async markReady(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/kitchen/orders/${orderId}/ready`,
    );
    return response.data.data.order;
  },

  async releaseOrder(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: Order }>>(
      `/kitchen/orders/${orderId}/release`,
    );
    return response.data.data.order;
  },
};
