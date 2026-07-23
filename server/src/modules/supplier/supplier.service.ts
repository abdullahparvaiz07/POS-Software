import supplierRepository from "./supplier.repository";
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from "./supplier.types";
import { SUPPLIER_MESSAGES } from "./supplier.constants";
import { ConflictError, NotFoundError } from "../../errors";

export class SupplierService {
  async createSupplier(data: CreateSupplierDto, userId: number) {
    const existingCode = await supplierRepository.findByCode(data.code);
    if (existingCode) {
      throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_CODE);
    }

    const existingName = await supplierRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_NAME);
    }

    if (data.email) {
      const existingEmail = await supplierRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_EMAIL);
      }
    }

    return supplierRepository.create(data, userId);
  }

  async getSuppliers(query: SupplierQueryDto) {
    return supplierRepository.findMany(query);
  }

  async getSupplierById(id: number) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError(SUPPLIER_MESSAGES.NOT_FOUND);
    }
    return supplier;
  }

  async updateSupplier(id: number, data: UpdateSupplierDto, userId: number) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError(SUPPLIER_MESSAGES.NOT_FOUND);
    }

    if (data.code && data.code !== supplier.code) {
      const existingCode = await supplierRepository.findByCode(data.code);
      if (existingCode) {
        throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_CODE);
      }
    }

    if (data.name && data.name !== supplier.name) {
      const existingName = await supplierRepository.findByName(data.name);
      if (existingName) {
        throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_NAME);
      }
    }

    if (data.email && data.email !== supplier.email) {
      const existingEmail = await supplierRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError(SUPPLIER_MESSAGES.DUPLICATE_EMAIL);
      }
    }

    return supplierRepository.update(id, data, userId);
  }

  async deleteSupplier(id: number, userId: number) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError(SUPPLIER_MESSAGES.NOT_FOUND);
    }

    const purchaseCount = await supplierRepository.countPurchases(id);

    if (purchaseCount > 0) {
      return supplierRepository.softDelete(id, userId);
    }

    return supplierRepository.delete(id);
  }
}

export default new SupplierService();
