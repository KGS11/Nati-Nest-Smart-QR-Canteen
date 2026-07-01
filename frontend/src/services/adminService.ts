import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { DashboardSummary, MenuItem, PopularItem, TableRecord } from "@/types/domain";

const todayRange = () => {
  const today = new Date().toISOString().slice(0, 10);
  return { startDate: today, endDate: today };
};

export const adminService = {
  async getDashboardSummary() {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>("/reports/dashboard");
    return response.data.data;
  },

  async getPopularItems(limit = 4) {
    const { startDate, endDate } = todayRange();
    const response = await apiClient.get<ApiResponse<{ items: PopularItem[] }>>(
      "/reports/popular-items",
      { params: { startDate, endDate, limit } },
    );
    return response.data.data.items;
  },

  async getMenuItems() {
    const response = await apiClient.get<ApiResponse<{ items: MenuItem[] }>>("/menu-items", {
      params: { isAvailable: undefined, limit: 100 },
    });
    return response.data.data.items;
  },

  async getTables() {
    const response = await apiClient.get<ApiResponse<TableRecord[]>>("/tables");
    return response.data.data;
  },

  async getComplaintEligibleOrders() {
    const response = await apiClient.get<ApiResponse<{ orders: any[]; count: number }>>(
      "/admin/orders/complaint-eligible",
    );
    return response.data.data.orders;
  },

  async reassignKitchen(orderId: string, staffId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: any }>>(
      `/admin/orders/${orderId}/reassign-kitchen`,
      { staffId }
    );
    return response.data.data.order;
  },

  async reassignWaiter(orderId: string, staffId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: any }>>(
      `/admin/orders/${orderId}/reassign-waiter`,
      { staffId }
    );
    return response.data.data.order;
  },

  async cancelOrderItem(
    orderId: string,
    itemId: string,
    payload: { reason: string; notes?: string },
  ) {
    const response = await apiClient.patch<ApiResponse<any>>(
      `/admin/orders/${orderId}/items/${itemId}/cancel`,
      payload,
    );
    return response.data.data;
  },

  async getCancelledItemAnalytics(startDate: string, endDate: string) {
    const response = await apiClient.get<ApiResponse<any>>("/reports/cancelled-items", {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async forceUnclaimKitchen(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: any }>>(
      `/admin/orders/${orderId}/force-unclaim-kitchen`
    );
    return response.data.data.order;
  },

  async forceUnclaimWaiter(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: any }>>(
      `/admin/orders/${orderId}/force-unclaim-waiter`
    );
    return response.data.data.order;
  },

  async forceDeliver(orderId: string) {
    const response = await apiClient.patch<ApiResponse<{ order: any }>>(
      `/admin/orders/${orderId}/force-deliver`
    );
    return response.data.data.order;
  },

  async getAssignmentHistory(orderId: string) {
    const response = await apiClient.get<ApiResponse<{ history: any[] }>>(
      `/admin/orders/${orderId}/assignment-history`
    );
    return response.data.data.history;
  },
};
