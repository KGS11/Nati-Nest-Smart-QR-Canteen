"use client";

import { create } from "zustand";
import { KitchenOrder } from "@/types/kitchen.types";

interface KitchenState {
  orders: KitchenOrder[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  newOrderAlert: { orderId: string; tableNumber: string } | null;

  setOrders: (orders: KitchenOrder[]) => void;
  addOrder: (order: KitchenOrder) => void;
  updateOrderStatus: (
    orderId: string,
    status: KitchenOrder["status"],
    fields?: Partial<KitchenOrder>,
  ) => void;
  removeOrder: (orderId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setNewOrderAlert: (alert: { orderId: string; tableNumber: string } | null) => void;
  getOrdersByStatus: (statuses: KitchenOrder["status"][]) => KitchenOrder[];
}

export const useKitchenStore = create<KitchenState>()((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  isConnected: false,
  newOrderAlert: null,

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders.filter((existing) => existing.id !== order.id)],
    })),

  updateOrderStatus: (orderId, status, fields) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status, ...fields } : order,
      ),
    })),

  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== orderId),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  setNewOrderAlert: (newOrderAlert) => set({ newOrderAlert }),

  getOrdersByStatus: (statuses) =>
    get().orders.filter((order) => statuses.includes(order.status)),
}));
