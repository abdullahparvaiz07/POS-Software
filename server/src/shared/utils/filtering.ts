export function getFilters(filters?: Record<string, any>) {
  if (!filters || Object.keys(filters).length === 0) {
    return undefined;
  }

  const whereClause: Record<string, any> = {};

  for (const [key, value] of Object.entries(filters)) {
    // Skip empty values but keep boolean false or numeric 0
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Type casting logic based on query string values
    if (typeof value === "string" && !isNaN(Number(value))) {
      whereClause[key] = Number(value);
    } else if (value === "true" || value === "false") {
      whereClause[key] = value === "true";
    } else {
      whereClause[key] = value;
    }
  }

  return Object.keys(whereClause).length > 0 ? whereClause : undefined;
}
