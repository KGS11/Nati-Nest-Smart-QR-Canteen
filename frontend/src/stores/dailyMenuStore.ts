"use client";

import { create } from "zustand";
import { DailyMenuItem, CategoryWithDailyStatus } from "@/types/daily-menu.types";
import { dailyMenuService } from "@/services/dailyMenuService";

interface DailyMenuState {
  todaysItems: DailyMenuItem[];
  fullMenuCategories: CategoryWithDailyStatus[];
  isLoadingToday: boolean;
  isLoadingFull: boolean;
  isCopying: boolean;
  searchQuery: string;
  selectedCategoryId: string | null;
  error: string | null;

  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: string | null) => void;

  fetchTodayMenu: () => Promise<void>;
  fetchFullMenu: () => Promise<void>;
  addItemToToday: (menuItemId: string) => Promise<void>;
  removeItemFromToday: (menuItemId: string) => Promise<void>;
  copyYesterdayMenu: () => Promise<void>;

  // Real-time Socket Handlers
  handleItemAdded: (payload: { menuItemId: string; name: string }) => void;
  handleItemRemoved: (payload: { menuItemId: string; name: string }) => void;
  handleCopied: (payload: { count: number; date: string }) => void;
}

export const useDailyMenuStore = create<DailyMenuState>()((set, get) => ({
  todaysItems: [],
  fullMenuCategories: [],
  isLoadingToday: false,
  isLoadingFull: false,
  isCopying: false,
  searchQuery: "",
  selectedCategoryId: null,
  error: null,

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchFullMenu();
  },

  setSelectedCategoryId: (selectedCategoryId) => {
    set({ selectedCategoryId });
    get().fetchFullMenu();
  },

  fetchTodayMenu: async () => {
    set({ isLoadingToday: true, error: null });
    try {
      const data = await dailyMenuService.getTodayMenu();
      set({ todaysItems: data.items, isLoadingToday: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to fetch today's menu", isLoadingToday: false });
    }
  },

  fetchFullMenu: async () => {
    set({ isLoadingFull: true, error: null });
    try {
      const { searchQuery, selectedCategoryId } = get();
      const data = await dailyMenuService.getFullMenuWithStatus(
        searchQuery || undefined,
        selectedCategoryId || undefined
      );
      set({ fullMenuCategories: data.categories, isLoadingFull: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to fetch full menu", isLoadingFull: false });
    }
  },

  addItemToToday: async (menuItemId) => {
    set({ error: null });
    try {
      await dailyMenuService.addItemToToday(menuItemId);
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu()]);
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to add item to today's menu" });
      throw err;
    }
  },

  removeItemFromToday: async (menuItemId) => {
    set({ error: null });
    try {
      await dailyMenuService.removeItemFromToday(menuItemId);
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu()]);
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to remove item from today's menu" });
      throw err;
    }
  },

  copyYesterdayMenu: async () => {
    set({ isCopying: true, error: null });
    try {
      await dailyMenuService.copyYesterdayMenu();
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu()]);
      set({ isCopying: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to copy yesterday's menu", isCopying: false });
      throw err;
    }
  },

  handleItemAdded: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
  },

  handleItemRemoved: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
  },

  handleCopied: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
  },
}));
