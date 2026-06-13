import { create } from "zustand";
import { RestaurantTable } from "@/types/table.types";

interface TableState {
  tables: RestaurantTable[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeModal:
    | { type: "createTable" }
    | { type: "editTable"; table: RestaurantTable }
    | { type: "viewQR"; table: RestaurantTable }
    | { type: "deleteTable"; table: RestaurantTable }
    | null;

  setTables: (tables: RestaurantTable[]) => void;
  addTable: (table: RestaurantTable) => void;
  updateTable: (table: RestaurantTable) => void;
  removeTable: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  openModal: (modal: TableState["activeModal"]) => void;
  closeModal: () => void;

  getFilteredTables: () => RestaurantTable[];
}

export const useTableStore = create<TableState>()((set, get) => ({
  tables: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  activeModal: null,

  setTables: (tables) => set({ tables }),
  addTable: (table) =>
    set((state) => ({
      tables: [...state.tables, table],
    })),
  updateTable: (table) =>
    set((state) => ({
      tables: state.tables.map((item) => (item.id === table.id ? table : item)),
    })),
  removeTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),

  getFilteredTables: () => {
    const { tables, searchQuery } = get();
    if (!searchQuery.trim()) return tables;

    return tables.filter((table) =>
      table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  },
}));
