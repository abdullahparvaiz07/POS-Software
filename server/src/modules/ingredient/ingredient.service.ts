import ingredientRepository from "./ingredient.repository";
import unitRepository from "../unit/unit.repository";
import { CreateIngredientDto, UpdateIngredientDto, IngredientQueryDto } from "./ingredient.types";
import { INGREDIENT_MESSAGES } from "./ingredient.constants";
import { ConflictError, NotFoundError } from "../../errors";

export class IngredientService {
  async createIngredient(data: CreateIngredientDto, userId: number) {
    // Check unit exists
    const unit = await unitRepository.findById(data.unitId);
    if (!unit) {
      throw new NotFoundError(INGREDIENT_MESSAGES.UNIT_NOT_FOUND);
    }

    // Check code unique
    const existingCode = await ingredientRepository.findByCode(data.code);
    if (existingCode) {
      throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_CODE);
    }

    // Check name unique
    const existingName = await ingredientRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_NAME);
    }

    // Check barcode unique if provided
    if (data.barcode) {
      const existingBarcode = await ingredientRepository.findByBarcode(data.barcode);
      if (existingBarcode) {
        throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_BARCODE);
      }
    }

    return ingredientRepository.create(data, userId);
  }

  async getIngredients(query: IngredientQueryDto) {
    return ingredientRepository.findMany(query);
  }

  async getLowStock(page?: string, limit?: string) {
    return ingredientRepository.findLowStock(page, limit);
  }

  async getIngredientById(id: number) {
    const ingredient = await ingredientRepository.findById(id);
    if (!ingredient) {
      throw new NotFoundError(INGREDIENT_MESSAGES.NOT_FOUND);
    }
    return ingredient;
  }

  async updateIngredient(id: number, data: UpdateIngredientDto, userId: number) {
    const ingredient = await ingredientRepository.findById(id);
    if (!ingredient) {
      throw new NotFoundError(INGREDIENT_MESSAGES.NOT_FOUND);
    }

    if (data.unitId && data.unitId !== ingredient.unitId) {
      const unit = await unitRepository.findById(data.unitId);
      if (!unit) {
        throw new NotFoundError(INGREDIENT_MESSAGES.UNIT_NOT_FOUND);
      }
    }

    if (data.code && data.code !== ingredient.code) {
      const existingCode = await ingredientRepository.findByCode(data.code);
      if (existingCode) {
        throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_CODE);
      }
    }

    if (data.name && data.name !== ingredient.name) {
      const existingName = await ingredientRepository.findByName(data.name);
      if (existingName) {
        throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_NAME);
      }
    }

    if (data.barcode && data.barcode !== ingredient.barcode) {
      const existingBarcode = await ingredientRepository.findByBarcode(data.barcode);
      if (existingBarcode) {
        throw new ConflictError(INGREDIENT_MESSAGES.DUPLICATE_BARCODE);
      }
    }

    return ingredientRepository.update(id, data, userId);
  }

  async deleteIngredient(id: number, userId: number) {
    const ingredient = await ingredientRepository.findById(id);
    if (!ingredient) {
      throw new NotFoundError(INGREDIENT_MESSAGES.NOT_FOUND);
    }

    const referenceCount = await ingredientRepository.countReferences(id);

    if (referenceCount > 0) {
      // Soft delete if referenced
      return ingredientRepository.softDelete(id, userId);
    }

    // Hard delete if not referenced
    return ingredientRepository.delete(id);
  }
}

export default new IngredientService();
