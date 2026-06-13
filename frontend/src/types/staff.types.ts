export type StaffRole = "ADMIN" | "KITCHEN" | "SERVER";

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface StaffPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffListResponse {
  items: StaffMember[];
  pagination: StaffPagination;
}

export interface StaffFormValues {
  name: string;
  phone: string;
  password?: string;
  role: StaffRole;
  isActive: boolean;
}
