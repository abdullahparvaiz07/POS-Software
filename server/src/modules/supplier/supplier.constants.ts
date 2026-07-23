export const SUPPLIER_MESSAGES = {
  CREATED: "Supplier created successfully.",
  UPDATED: "Supplier updated successfully.",
  DELETED: "Supplier deleted successfully.",
  NOT_FOUND: "Supplier not found.",
  FETCHED: "Suppliers fetched successfully.",
  FETCHED_ONE: "Supplier fetched successfully.",
  DUPLICATE_NAME: "Supplier with this name already exists.",
  DUPLICATE_CODE: "Supplier with this code already exists.",
  DUPLICATE_EMAIL: "Supplier with this email already exists.",
  REFERENCED: "Cannot delete supplier because it has associated purchases.",
} as const;
