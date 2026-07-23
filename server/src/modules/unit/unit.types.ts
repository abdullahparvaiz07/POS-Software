import { UnitType } from "@prisma/client";

export interface CreateUnitDto {
  name: string;
  shortName: string;
  unitType: UnitType;
  isBaseUnit?: boolean;
  conversionFactor?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateUnitDto {
  name?: string;
  shortName?: string;
  unitType?: UnitType;
  isBaseUnit?: boolean;
  conversionFactor?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UnitQueryDto {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
  unitType?: UnitType;
  isActive?: string;
}
