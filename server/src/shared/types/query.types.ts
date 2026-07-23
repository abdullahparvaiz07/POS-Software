export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

export interface FilterOptions {
  [key: string]: any;
}

export interface ApiQueryOptions extends PaginationOptions, SortOptions, SearchOptions {
  filters?: FilterOptions;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
