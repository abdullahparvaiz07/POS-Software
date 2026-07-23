import { QUERY_CONSTANTS } from "../constants/query.constants";

export function getPagination(page?: any, limit?: any) {
  const pageNumber = page ? parseInt(page as string, 10) : QUERY_CONSTANTS.DEFAULT_PAGE;
  let limitNumber = limit ? parseInt(limit as string, 10) : QUERY_CONSTANTS.DEFAULT_LIMIT;

  if (isNaN(pageNumber) || pageNumber < 1) {
    return { skip: 0, take: QUERY_CONSTANTS.DEFAULT_LIMIT, page: 1, limit: QUERY_CONSTANTS.DEFAULT_LIMIT };
  }

  if (isNaN(limitNumber) || limitNumber < 1) {
    limitNumber = QUERY_CONSTANTS.DEFAULT_LIMIT;
  }

  if (limitNumber > QUERY_CONSTANTS.MAX_LIMIT) {
    limitNumber = QUERY_CONSTANTS.MAX_LIMIT;
  }

  const skip = (pageNumber - 1) * limitNumber;

  return {
    skip,
    take: limitNumber,
    page: pageNumber,
    limit: limitNumber,
  };
}

export function formatPaginationMeta(
  totalRecords: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
