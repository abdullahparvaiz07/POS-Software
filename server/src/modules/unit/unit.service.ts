import unitRepository from "./unit.repository";
import { CreateUnitDto, UpdateUnitDto, UnitQueryDto } from "./unit.types";
import { UNIT_MESSAGES } from "./unit.constants";
import { ConflictError, NotFoundError } from "../../errors";

export class UnitService {
  async createUnit(data: CreateUnitDto) {
    const existingName = await unitRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictError(UNIT_MESSAGES.DUPLICATE_NAME);
    }

    const existingShortName = await unitRepository.findByShortName(data.shortName);
    if (existingShortName) {
      throw new ConflictError(UNIT_MESSAGES.DUPLICATE_SHORT_NAME);
    }

    return unitRepository.create(data);
  }

  async getUnits(query: UnitQueryDto) {
    return unitRepository.findMany(query);
  }

  async getUnitById(id: number) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(UNIT_MESSAGES.NOT_FOUND);
    }
    return unit;
  }

  async updateUnit(id: number, data: UpdateUnitDto) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(UNIT_MESSAGES.NOT_FOUND);
    }

    if (data.name && data.name !== unit.name) {
      const existingName = await unitRepository.findByName(data.name);
      if (existingName) {
        throw new ConflictError(UNIT_MESSAGES.DUPLICATE_NAME);
      }
    }

    if (data.shortName && data.shortName !== unit.shortName) {
      const existingShortName = await unitRepository.findByShortName(data.shortName);
      if (existingShortName) {
        throw new ConflictError(UNIT_MESSAGES.DUPLICATE_SHORT_NAME);
      }
    }

    return unitRepository.update(id, data);
  }

  async deleteUnit(id: number) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(UNIT_MESSAGES.NOT_FOUND);
    }

    const referenceCount = await unitRepository.countReferences(id);

    if (referenceCount > 0) {
      // Soft delete if referenced
      return unitRepository.softDelete(id);
    }

    // Hard delete if not referenced
    return unitRepository.delete(id);
  }
}

export default new UnitService();
