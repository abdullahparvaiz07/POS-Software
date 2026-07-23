import { QUERY_CONSTANTS } from "../constants/query.constants";

export function getSorting(sortBy?: any, sortOrder?: any) {
  const field = typeof sortBy === "string" && sortBy.trim() !== "" ? sortBy : QUERY_CONSTANTS.DEFAULT_SORT_FIELD;
  const order = typeof sortOrder === "string" && sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

  return {
    [field]: order,
  };
}
