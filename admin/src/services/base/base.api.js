import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "../auth/auth.slice.js";

// List of endpoints that REQUIRE credentials (cookies)
// These endpoints need credentials to:
// - Login: Receive cookies (refresh token) from backend
// - Logout: Send cookies to backend for session invalidation
// - Refresh: Send cookies (refresh token) to backend
const credentialsRequiredEndpoints = [
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
];

// Check if an endpoint requires credentials
const requiresCredentials = (url) => {
  return credentialsRequiredEndpoints.some((endpoint) => url.includes(endpoint));
};

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_ENDPOINT,
  // Default: don't send credentials (avoids CORS issues)
  credentials: "omit",
  // eslint-disable-next-line no-unused-vars
  prepareHeaders: (headers, { endpoint }) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom base query that conditionally includes credentials
const baseQueryWithCredentials = async (args, api, extraOptions) => {
  // Determine if this endpoint needs credentials
  const url = typeof args === "string" ? args : args.url;
  const needsCredentials = requiresCredentials(url);

  // Create a modified args object with credentials if needed
  const modifiedArgs = typeof args === "string"
    ? { url: args, credentials: needsCredentials ? "include" : "omit" }
    : { ...args, credentials: needsCredentials ? "include" : "omit" };

  return baseQuery(modifiedArgs, api, extraOptions);
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQueryWithCredentials(args, api, extraOptions);

  // If access token expired (401)
  if (result?.error?.status === 401) {
    // Check if the failed request was already a refresh attempt
    const url = typeof args === "string" ? args : args.url;
    const isRefreshRequest = url?.includes("/auth/refresh");

    // If this is already a refresh request that failed, don't retry - just logout
    if (isRefreshRequest) {
      console.log("Refresh token failed. Logging out...");
      // Reset API cache
      api.dispatch(baseApi.util.resetApiState());
      // Logout user
      api.dispatch(logout());
      return result;
    }

    console.log("Access token expired. Trying refresh...");

    // Try refreshing token (refresh endpoint needs credentials)
    const refreshResult = await baseQueryWithCredentials(
      { url: "/auth/refresh", credentials: "include" },
      api,
      extraOptions
    );

    if (refreshResult?.data) {
      // If refresh successful → retry original query with credentials
      result = await baseQueryWithCredentials(args, api, extraOptions);
    } else {
      // If refresh failed → logout user immediately (don't retry)
      console.log("Refresh token failed. Logging out...");
      // Reset API cache
      api.dispatch(baseApi.util.resetApiState());
      // Logout user
      api.dispatch(logout());
    }
  }

  return result;
};

const API_TAGS = {
  LEADS: "Leads",
  CLIENTS: "Clients",
  CONTACTS: "Contacts",
  ORGANIZATIONS: "Organizations",
  DEPARTMENTS: "Departments",
  USERS: "Users",
  ROLES: "Roles",
  PERMISSIONS: "Permissions",
  QUOTATIONS: "Quotations",
  SALES_ORDERS: "SalesOrders",
  PRODUCTS: "Products",
  LIABILITY: "Liability",
  INVOICE: 'Invoice',
  ACTIVITY_FEED: "ActivityFeed",
  INVOICES: "Invoices",
  GRN: "GRN",
  AMC: "AMC",
  RMA: "RMA",
  TICKETS: "Tickets",
  TICKET: "Ticket",
  INVENTORY: "Inventory",
  PURCHASE_ORDER: "PurchaseOrder",
  GRNS: "Grns",
  EXPENSE_CATEGORIES: "ExpenseCategories",
  FEATURE_ACCESS: "FeatureAccess",
  HRMS: "HRMS",
  EMPLOYEES: "Employees",
  EMPLOYEE_DEPARTMENTS: "EmployeeDepartments",
  ATTENDANCE: "Attendance",
  SHIFTS: "Shifts",
  HR_SETTINGS: "HrSettings",
  WEEKLY_OFF: "WeeklyOff",
  STATUTORY_SETTINGS: "StatutorySettings",
}

export const {
  LEADS,
  CLIENTS,
  CONTACTS,
  ORGANIZATIONS,
  DEPARTMENTS,
  USERS,
  ROLES,
  PERMISSIONS,
  QUOTATIONS,
  SALES_ORDERS,
  INVOICES,
  PRODUCTS,
  INVOICE,
  ACTIVITY_FEED,
  GRN,
  AMC,
  RMA,
  TICKETS,
  TICKET,
  INVENTORY,
  PURCHASE_ORDER,
  GRNS,
  FEATURE_ACCESS,
  HRMS,
  EMPLOYEES,
  EMPLOYEE_DEPARTMENTS,
  ATTENDANCE,
  INVENTORY_GRN,
  PURCHASE_ORDERS,
  VENDOR,
  INVOICE_PAYMENT,
  LIABILITY,
  SHIFTS,
  HR_SETTINGS,
  WEEKLY_OFF,
  STATUTORY_SETTINGS
} = API_TAGS;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: Object.values(API_TAGS),
  endpoints: () => ({}),
});

export const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;

  const endpoint = import.meta.env.VITE_API_ENDPOINT;
  return `${endpoint}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

