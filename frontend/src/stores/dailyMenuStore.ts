"use client";

import { create } from "zustand";
import { DailyMenuItem, CategoryWithDailyStatus } from "@/types/daily-menu.types";
import { dailyMenuService } from "@/services/dailyMenuService";

interface DailyMenuState {
  todaysItems: DailyMenuItem[];
  removedItems: DailyMenuItem[];
  fullMenuCategories: CategoryWithDailyStatus[];
  isLoadingToday: boolean;
  isLoadingRemoved: boolean;
  isLoadingFull: boolean;
  isCopying: boolean;
  searchQuery: string;
  selectedCategoryId: string | null;
  error: string | null;

  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: string | null) => void;

  fetchTodayMenu: () => Promise<void>;
  fetchRemovedItems: () => Promise<void>;
  fetchFullMenu: () => Promise<void>;
  addItemToToday: (menuItemId: string) => Promise<void>;
  removeItemFromToday: (menuItemId: string, reason: string, reasonType: string) => Promise<void>;
  restoreItem: (dailyMenuId: string) => Promise<void>;
  copyYesterdayMenu: () => Promise<void>;

  // Real-time Socket Handlers
  handleItemAdded: (payload: { menuItemId: string; name: string }) => void;
  handleItemRemoved: (payload: { menuItemId: string; name: string }) => void;
  handleCopied: (payload: { count: number; date: string }) => void;
}

export const useDailyMenuStore = create<DailyMenuState>()((set, get) => ({
  todaysItems: [],
  removedItems: [],
  fullMenuCategories: [],
  isLoadingToday: false,
  isLoadingRemoved: false,
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

  fetchRemovedItems: async () => {
    set({ isLoadingRemoved: true, error: null });
    try {
      const data = await dailyMenuService.getRemovedItems();
      set({ removedItems: data.items, isLoadingRemoved: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to fetch removed items", isLoadingRemoved: false });
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
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu(), get().fetchRemovedItems()]);
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to add item to today's menu" });
      throw err;
    }
  },

  removeItemFromToday: async (menuItemId, reason, reasonType) => {
    set({ error: null });
    try {
      await dailyMenuService.removeItemFromToday(menuItemId, reason, reasonType);
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu(), get().fetchRemovedItems()]);
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to remove item from today's menu" });
      throw err;
    }
  },

  restoreItem: async (dailyMenuId) => {
    set({ error: null });
    try {
      await dailyMenuService.restoreItem(dailyMenuId);
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu(), get().fetchRemovedItems()]);
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to restore item to today's menu" });
      throw err;
    }
  },

  copyYesterdayMenu: async () => {
    set({ isCopying: true, error: null });
    try {
      await dailyMenuService.copyYesterdayMenu();
      await Promise.all([get().fetchTodayMenu(), get().fetchFullMenu(), get().fetchRemovedItems()]);
      set({ isCopying: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to copy yesterday's menu", isCopying: false });
      throw err;
    }
  },

  handleItemAdded: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
    get().fetchRemovedItems();
  },

  handleItemRemoved: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
    get().fetchRemovedItems();
  },

  handleCopied: (payload) => {
    get().fetchTodayMenu();
    get().fetchFullMenu();
    get().fetchRemovedItems();
  },
}));
