import { baseApi } from "../base/base.api";

export const workflowApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Configs
        getWorkflows: builder.query({
            query: () => ({
                url: "/admin/hrms/workflow/config",
                method: "GET",
            }),
            providesTags: ["Workflow"],
        }),

        saveWorkflow: builder.mutation({
            query: (workflowData) => ({
                url: "/admin/hrms/workflow/config",
                method: "POST",
                body: workflowData,
            }),
            invalidatesTags: ["Workflow"],
        }),

        // Requests
        getPendingRequests: builder.query({
            query: () => ({
                url: "/admin/hrms/workflow/pending",
                method: "GET",
            }),
            transformResponse: (response) => response?.data || [],
            providesTags: ["WorkflowAction"],
        }),
        
        getAllRequests: builder.query({
            query: (params) => ({
                url: "/admin/hrms/workflow/all",
                method: "GET",
                params: params,
            }),
            providesTags: ["WorkflowAction"],
        }),

        processAction: builder.mutation({
            query: ({ id, action, comments }) => ({
                url: `/admin/hrms/workflow/action/${id}`,
                method: "POST",
                body: { action, comments },
            }),
            invalidatesTags: ["WorkflowAction", "Leaves", "LeaveBalance", "Attendance", "Payroll", "Loans", "Expenses", "Incentives"],
        }),

        processBulkAction: builder.mutation({
            query: ({ ids, action, comments }) => ({
                url: `/admin/hrms/workflow/action/bulk`,
                method: "POST",
                body: { ids, action, comments },
            }),
            invalidatesTags: ["WorkflowAction", "Leaves", "LeaveBalance", "Attendance", "Payroll", "Loans", "Expenses", "Incentives"],
        }),

        getApprovalLogs: builder.query({
            query: ({ module, entityId }) => ({
                url: "/admin/hrms/workflow/logs",
                method: "GET",
                params: { module, entityId },
            }),
            transformResponse: (response) => response?.data || [],
            providesTags: ["WorkflowAction"],
        }),
    }),
});

export const {
    useGetWorkflowsQuery,
    useSaveWorkflowMutation,
    useGetPendingRequestsQuery,
    useGetAllRequestsQuery,
    useProcessActionMutation,
    useProcessBulkActionMutation,
    useGetApprovalLogsQuery,
} = workflowApi;
