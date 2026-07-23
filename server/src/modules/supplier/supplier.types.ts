import { SupplierStatus } from "@prisma/client";

export interface CreateSupplierDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  code?: string;
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
  notes?: string;
  status?: SupplierStatus;
}

export interface SupplierQueryDto {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
  status?: SupplierStatus;
}
