export function getSearchQuery(search?: any, searchFields?: string[]) {
  if (!search || typeof search !== "string" || search.trim() === "" || !searchFields || searchFields.length === 0) {
    return undefined;
  }

  const searchConditions = searchFields.map((field) => ({
    [field]: {
      contains: search,
      mode: "insensitive", // Prisma specific: case-insensitive search
    },
  }));

  return {
    OR: searchConditions,
  };
}
