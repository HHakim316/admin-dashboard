// src/constants/roles.js
export const ROLES = {
  ADMIN: "admin",
  STORE_MANAGER: 'store_manager',
  SALES: 'sales',
};

// Role access groups
export const DASHBOARD_ACCESS = [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.SALES];
export const INVENTORY_ACCESS = [ROLES.ADMIN, ROLES.STORE_MANAGER];
export const REPORTS_ACCESS = [ROLES.ADMIN, ROLES.STORE_MANAGER];
export const SUPER_ADMIN = "SUPER_ADMIN"; // Added for future use