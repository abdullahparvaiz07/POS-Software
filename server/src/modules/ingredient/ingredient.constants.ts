export const INGREDIENT_MESSAGES = {
  CREATED: "Ingredient created successfully.",
  UPDATED: "Ingredient updated successfully.",
  DELETED: "Ingredient deleted successfully.",
  NOT_FOUND: "Ingredient not found.",
  FETCHED: "Ingredients fetched successfully.",
  FETCHED_ONE: "Ingredient fetched successfully.",
  DUPLICATE_NAME: "Ingredient with this name already exists.",
  DUPLICATE_CODE: "Ingredient with this code already exists.",
  DUPLICATE_BARCODE: "Ingredient with this barcode already exists.",
  UNIT_NOT_FOUND: "The specified Unit does not exist.",
  REFERENCED: "Cannot delete ingredient because it is currently in use.",
} as const;
