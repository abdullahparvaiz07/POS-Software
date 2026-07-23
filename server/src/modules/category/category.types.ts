export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
  isCustom?: boolean;
  parentId?: number;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}
