/**
 * HRMS Route Action Registry
 * Defines which actions are valid for each route/page.
 * These will be rendered as dynamic toggles in the RBAC Matrix.
 */
export const HRMS_ROUTE_ACTIONS = {
    // --- 0. Global / Dashboard ---
    "/dashboard": [{ key: "view", label: "View Dashboard" }],
    "/hrms": [{ key: "view", label: "Module Access" }],
    "/settings": [{ key: "view", label: "Security Access" }],

    // --- 1. HRMS Core ---
    "/hrms/core": [
        { key: "view", label: "View Registry" }, 
        { key: "create", label: "Add Employee" }, 
        { key: "edit", label: "Update" }, 
        { key: "offer_letter", label: "Offer Letter" },
        { key: "increment_letter", label: "Increment Letter" },
        { key: "add_increment", label: "Add Increment" },
        { key: "delete", label: "Terminate" }, 
        { key: "export", label: "Export Data" }
    ],
    "/hrms/departments": [{ key: "view", label: "View List" }, { key: "create", label: "Add Dept" }, { key: "edit", label: "Update" }, { key: "delete", label: "Remove" }],

    // --- 7. HRMS Attendance ---
    "/hrms/attendance": [{ key: "view", label: "Module Access" }],
    "/hrms/attendance/dashboard": [{ key: "view", label: "View Analytics" }],
    "/hrms/attendance/daily": [{ key: "view", label: "View Logs" }, { key: "edit", label: "Update" }],
    "/hrms/attendance/reports": [{ key: "view", label: "View Reports" }, { key: "export", label: "Export Data" }],
    "/hrms/attendance/holiday": [{ key: "view", label: "View Calendar" }, { key: "create", label: "Add Holiday" }, { key: "edit", label: "Update" }, { key: "delete", label: "Remove" }],
    "/hrms/attendance/weekly-off": [{ key: "view", label: "View Rules" }, { key: "edit", label: "Update" }],
    "/hrms/attendance/shifts": [{ key: "view", label: "View Shifts" }, { key: "create", label: "Add Shift" }, { key: "edit", label: "Update" }],
    "/hrms/attendance/sync": [{ key: "view", label: "Sync Panel" }, { key: "mark", label: "Trigger Sync" }],

    // --- 8. HRMS Leave ---
    "/hrms/leave": [{ key: "view", label: "Module Access" }],
    "/hrms/leave/dashboard": [{ key: "view", label: "View Stats" }],
    "/hrms/leave/apply": [{ key: "view", label: "View History" }, { key: "apply", label: "Apply Leave" }],
    "/hrms/leave/requests": [{ key: "view", label: "View Inbox" }, { key: "approve", label: "Approve/Reject" }],
    "/hrms/leave/policy": [{ key: "view", label: "View Policies" }, { key: "create", label: "Add Policy" }, { key: "edit", label: "Update" }],
    "/hrms/leave/permission": [{ key: "view", label: "View Permissions" }, { key: "apply", label: "Apply Permission" }],
    "/hrms/admin/leave-balances": [{ key: "view", label: "View Balances" }, { key: "edit", label: "Update" }],

    // --- 9. HRMS Approvals ---
    "/hrms/approvals": [{ key: "view", label: "View Inbox" }, { key: "approve", label: "Approve/Reject" }],

    // --- 10. HRMS Payroll ---
    "/hrms/payroll": [{ key: "view", label: "Module Access" }],
    "/hrms/payroll/dashboard": [{ key: "view", label: "View Analytics" }],
    "/hrms/payroll/structure": [{ key: "view", label: "View Setup" }, { key: "create", label: "Add Component" }, { key: "edit", label: "Update" }],
    "/hrms/payroll/process": [{ key: "view", label: "View Batch" }, { key: "calculate", label: "Run Payroll" }, { key: "approve", label: "Update/Finalize" }],
    "/hrms/payroll/loans": [{ key: "view", label: "View Loans" }, { key: "apply", label: "Apply Loan" }, { key: "approve", label: "Approve/Reject" }],
    "/hrms/payroll/bonus": [{ key: "view", label: "View Incentives" }, { key: "calculate", label: "Update/Process" }],
    "/hrms/payroll/history": [{ key: "view", label: "View History" }, { key: "export", label: "Export Data" }],
    "/hrms/payroll/settlements": [{ key: "view", label: "View Settlements" }, { key: "mark", label: "Update Status" }],

    // --- 11. HRMS Compliance ---
    "/hrms/compliance": [{ key: "view", label: "Module Access" }],
    "/hrms/compliance/dashboard": [{ key: "view", label: "View Analytics" }],
    "/hrms/compliance/pf": [{ key: "view", label: "View PF" }, { key: "edit", label: "Update" }, { key: "export", label: "Export Data" }],
    "/hrms/compliance/esi": [{ key: "view", label: "View ESI" }, { key: "edit", label: "Update" }, { key: "export", label: "Export Data" }],
    "/hrms/compliance/pt": [{ key: "view", label: "View PT" }, { key: "edit", label: "Update" }],

    // --- 7. HRMS Expense ---
    "/hrms/expense": [{ key: "view", label: "Module Access" }],
    "/hrms/expense/dashboard": [{ key: "view", label: "View Analytics" }],
    "/hrms/expense/add": [{ key: "view", label: "My Claims" }, { key: "apply", label: "Submit Claim" }],
    "/hrms/expense/approvals": [{ key: "view", label: "Pending Claims" }, { key: "approve", label: "Approve/Reject" }],
    "/hrms/expense/reimbursement": [{ key: "view", label: "View History" }, { key: "mark", label: "Mark Paid" }],

    // --- 8. HRMS ESS (Employee Portal) ---
    "/hrms/ess": [{ key: "view", label: "Module Access" }],
    "/hrms/ess/dashboard": [{ key: "view", label: "My Dashboard" }],
    "/hrms/ess/payslips": [{ key: "view", label: "My Payslips" }, { key: "export", label: "Export PDF" }],
    "/hrms/ess/attendance": [{ key: "view", label: "My Attendance" }],
    "/hrms/ess/profile": [{ key: "view", label: "My Profile" }, { key: "edit", label: "Update Request" }],
    "/hrms/ess/expenses": [{ key: "view", label: "My Expenses" }, { key: "apply", label: "Claim Expense" }],

    // --- 9. HRMS Admin & Reports ---
    "/hrms/admin": [{ key: "view", label: "Module Access" }],
    "/hrms/reports/standard": [{ key: "view", label: "View Reports" }, { key: "export", label: "Export Data" }],
    "/hrms/reports/analytics": [{ key: "view", label: "View Charts" }],
    "/hrms/admin/dashboard": [{ key: "view", label: "Admin Stats" }],
    "/hrms/admin/audit": [{ key: "view", label: "View Logs" }],
    "/hrms/admin/workflow": [{ key: "view", label: "View Chains" }, { key: "edit", label: "Update" }],
    "/hrms/admin/settings": [{ key: "view", label: "View Config" }, { key: "edit", label: "Update" }],

    // --- 10. Security & System ---
    "/settings/users": [{ key: "view", label: "View Users" }, { key: "create", label: "Add User" }, { key: "edit", label: "Update" }, { key: "delete", label: "Deactivate" }],
    "/settings/roles": [{ key: "view", label: "View Matrix" }, { key: "edit", label: "Update" }, { key: "create", label: "Add Role" }],
};

/**
 * Helper to get actions for a specific route
 */
export const getActionsForRoute = (routePath) => {
    return HRMS_ROUTE_ACTIONS[routePath] || [
        { key: "view", label: "View Only" }
    ];
};
