import { getPagination } from "../utils/pagination";
import { getSorting } from "../utils/sorting";
import { getSearchQuery } from "../utils/searching";
import { getFilters } from "../utils/filtering";

/**
 * Builds a Prisma query object combining pagination, sorting, search, and filtering.
 * 
 * @param query - The raw query object from req.query
 * @param searchFields - An array of fields to apply the search string to (e.g. ['name', 'description'])
 */
export function buildQuery(query: any = {}, searchFields: string[] = []) {
  const { page, limit, sortBy, sortOrder, search, ...restFilters } = query;

  const pagination = getPagination(page, limit);
  const orderBy = getSorting(sortBy, sortOrder);
  const searchCondition = getSearchQuery(search, searchFields);
  const filterConditions = getFilters(restFilters);

  // Combine search and filters into a single where clause
  let where: Record<string, any> = {};

  if (searchCondition && filterConditions) {
    where = {
      AND: [searchCondition, filterConditions],
    };
  } else if (searchCondition) {
    where = searchCondition;
  } else if (filterConditions) {
    where = filterConditions;
  }

  return {
    where,
    orderBy,
    skip: pagination.skip,
    take: pagination.take,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
    },
  };
}
