export const CACHE_KEYS = {
  // Application Data
  DASHBOARD_SUMMARY: "dashboard:summary",
  SALES_DAILY: "sales:daily",
  SALES_MONTHLY: "sales:monthly",
  MENU_ALL: "menu:all",
  SETTINGS: "settings",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  CATEGORY_LIST: "category:list",
  
  // Dynamic functions to generate specific keys
  jwtBlacklist: (token: string) => `jwt:blacklist:${token}`,
  session: (userId: number) => `session:${userId}`,
  lock: (key: string) => `lock:${key}`,
};

// Common TTLs in seconds
export const CACHE_TTL = {
  DASHBOARD: 30, // 30 seconds
  SALES: 300, // 5 minutes
  SETTINGS: 3600, // 1 hour
  ROLES: 43200, // 12 hours
  CATEGORIES: 1800, // 30 minutes
  MENU: 900, // 15 minutes
};
