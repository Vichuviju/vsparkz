const MODULES = {
    WARRANTY_CHECK: 3,
    AMC: 4,
    GRN: 5,
    RMA: 6,
    TICKETS: 7,
}

const ACCESS_TYPES = {
    INVOICE_DETAILS: "invoice_details",
    COVERAGE_MAINTENANCE: "coverage_maintenance",
    ACCESS_REQUEST: "access_request",
}

const ROLES = {
    ADMIN: "admin",
    SALES_MANAGER: "sales_manager",
    SALES_EXECUTIVE: "sales_representative",
    SUPPORT_AGENT: "support_agent",
    SUPER_ADMIN: "super_admin",
    STORE_MANAGER: "store_operations_manager",
    STORE_MEMBER: "store_operations_member",
    ACCOUNTS_MANAGER: "accounts_manager",
    ACCOUNTS_EXECUTIVE: "accounts_executive",
    ACCOUNTS_MEMBER: "accounts_member",
    HR_ADMIN: "HR Admin",
    MANAGER: "Manager",
    FINANCE: "Finance",
    EMPLOYEE: "Employee",
    SYS_ADMIN: "Sys Admin",
}

export { MODULES, ACCESS_TYPES, ROLES };