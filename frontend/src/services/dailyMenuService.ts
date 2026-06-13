import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { DailyMenuItem, CategoryWithDailyStatus } from "@/types/daily-menu.types";

export const dailyMenuService = {
  async getTodayMenu() {
    const response = await apiClient.get<ApiResponse<{ date: string; items: DailyMenuItem[]; count: number }>>(
      "/daily-menu/today"
    );
    return response.data.data;
  },

  async getFullMenuWithStatus(search?: string, categoryId?: string) {
    const response = await apiClient.get<ApiResponse<{ date: string; categories: CategoryWithDailyStatus[] }>>(
      "/daily-menu/full",
      { params: { search, categoryId } }
    );
    return response.data.data;
  },

  async addItemToToday(menuItemId: string) {
    const response = await apiClient.post<ApiResponse<any>>("/daily-menu/add", { menuItemId });
    return response.data.data;
  },

  async removeItemFromToday(menuItemId: string) {
    const response = await apiClient.delete<ApiResponse<any>>(`/daily-menu/remove/${menuItemId}`);
    return response.data.data;
  },

  async copyYesterdayMenu() {
    const response = await apiClient.post<ApiResponse<{ copied: number; skipped: number; items: any[] }>>(
      "/daily-menu/copy-yesterday"
    );
    return response.data.data;
  },

  async getHistoryMenu(date: string) {
    const response = await apiClient.get<ApiResponse<{ date: string; items: any[]; count: number }>>(
      `/daily-menu/history/${date}`
    );
    return response.data.data;
  },
};
