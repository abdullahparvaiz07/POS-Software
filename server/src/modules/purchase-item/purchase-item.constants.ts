export const PURCHASE_ITEM_MESSAGES = {
  CREATED: "Purchase item created successfully.",
  UPDATED: "Purchase item updated successfully.",
  DELETED: "Purchase item deleted successfully.",
  NOT_FOUND: "Purchase item not found.",
  FETCHED: "Purchase items fetched successfully.",
  FETCHED_ONE: "Purchase item fetched successfully.",
  PURCHASE_NOT_FOUND: "The specified purchase does not exist.",
  PURCHASE_NOT_EDITABLE: "Cannot add, edit, or delete items on a purchase that is RECEIVED or CANCELLED.",
  INGREDIENT_NOT_FOUND: "The specified ingredient does not exist or is inactive.",
} as const;
