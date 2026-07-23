export interface CreateModifierDto {
  name: string;
  price?: number;
  isAvailable?: boolean;
}

export interface CreateModifierGroupDto {
  name: string;
  minSelections?: number;
  maxSelections?: number;
  modifiers: CreateModifierDto[];
}

export interface UpdateModifierGroupDto {
  name?: string;
  minSelections?: number;
  maxSelections?: number;
  modifiers?: CreateModifierDto[];
}
