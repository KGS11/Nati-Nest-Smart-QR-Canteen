export enum DailyMenuRemovalReason {
  OUT_OF_STOCK = "OUT_OF_STOCK",
  INGREDIENT_FINISHED = "INGREDIENT_FINISHED",
  MACHINE_PROBLEM = "MACHINE_PROBLEM",
  KITCHEN_CLOSED = "KITCHEN_CLOSED",
  OTHER = "OTHER",
}

export interface DailyMenuItem {
  dailyMenuId: string;
  menuItemId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPopular: boolean;
  category: {
    id: string;
    name: string;
  };
  addedAt: string;
  addedBy: {
    name: string;
  };
  removedAt?: string | null;
  removedBy?: {
    name: string;
  } | null;
  removalReason?: string | null;
  removalReasonType?: DailyMenuRemovalReason | null;
}

export interface MenuItemWithStatus {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  isOnTodaysMenu: boolean;
  dailyMenuId: string | null;
}

export interface CategoryWithDailyStatus {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemWithStatus[];
}

export interface DailyMenuStatus {
  date: string;
  items: DailyMenuItem[];
  count: number;
}

