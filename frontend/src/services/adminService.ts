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
};
