export interface CreateSizeTemplateItemDto {
  name: string;
  displayOrder?: number;
}

export interface CreateSizeTemplateDto {
  name: string;
  items: CreateSizeTemplateItemDto[];
}

export interface UpdateSizeTemplateDto {
  name?: string;
  items?: CreateSizeTemplateItemDto[];
}
