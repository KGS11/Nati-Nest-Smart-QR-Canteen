"use client";

import { create } from "zustand";
import { MenuItem } from "@/types/domain";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  instructions?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  updateSpecialInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return {
          items: state.items.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
          },
        ],
      };
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((cartItem) => cartItem.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((cartItem) => cartItem.id !== id)
          : state.items.map((cartItem) =>
              cartItem.id === id ? { ...cartItem, quantity } : cartItem,
            ),
    })),
  updateInstructions: (id, instructions) =>
    set((state) => ({
      items: state.items.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, instructions } : cartItem,
      ),
    })),
  updateSpecialInstructions: (id, instructions) =>
    set((state) => ({
      items: state.items.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, instructions } : cartItem,
      ),
    })),
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalAmount: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
