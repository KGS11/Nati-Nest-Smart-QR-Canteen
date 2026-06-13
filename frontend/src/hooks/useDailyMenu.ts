"use client";

import { useEffect } from "react";
import { useDailyMenuStore } from "@/stores/dailyMenuStore";
import { useSocketContext } from "@/context/SocketContext";

export function useDailyMenu() {
  const { socket } = useSocketContext();
  const store = useDailyMenuStore();

  useEffect(() => {
    if (!socket) return;

    const handleItemAdded = (payload: { menuItemId: string; name: string }) => {
      store.handleItemAdded(payload);
    };

    const handleItemRemoved = (payload: { menuItemId: string; name: string }) => {
      store.handleItemRemoved(payload);
    };

    const handleCopied = (payload: { count: number; date: string }) => {
      store.handleCopied(payload);
    };

    socket.on("daily-menu:item-added", handleItemAdded);
    socket.on("daily-menu:item-removed", handleItemRemoved);
    socket.on("daily-menu:copied", handleCopied);

    return () => {
      socket.off("daily-menu:item-added", handleItemAdded);
      socket.off("daily-menu:item-removed", handleItemRemoved);
      socket.off("daily-menu:copied", handleCopied);
    };
  }, [socket, store]);

  return store;
}
