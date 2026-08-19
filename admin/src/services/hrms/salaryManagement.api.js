import { baseApi } from "../base/base.api";

export const salaryManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* GET SALARY MANAGEMENT (Legacy) */
    getSalaryManagement: builder.query({
        query: (month) => ({
            url: "/admin/hrms/salary-management",
            params: { month }
        }),
        transformResponse: (response) => response?.data || [],
        providesTags: ["PAYROLL"]
    }),

    /* Process Payroll Run */
    processPayroll: builder.mutation({
        query: (data) => ({
            url: "/admin/hrms/salary-management/process",
            method: "POST",
            body: data
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),

    /* Get All Payroll Runs */
    getPayrollRuns: builder.query({
        query: () => "/admin/hrms/salary-management/runs",
        transformResponse: (res) => res?.data || [],
        providesTags: ["PAYROLL"]
    }),

    /* Get Detail Records for a Run */
    getPayrollRecords: builder.query({
        query: (runId) => `/admin/hrms/salary-management/runs/${runId}/records`,
        transformResponse: (res) => res?.data || [],
        providesTags: (result, error, id) => [{ type: "PAYROLL_RECORDS", id }]
    }),

    /* Lock Payroll Run */
    lockPayrollRun: builder.mutation({
        query: (runId) => ({
            url: `/admin/hrms/salary-management/runs/${runId}/lock`,
            method: "POST"
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),

    /* Delete Payroll Run */
    deletePayrollRun: builder.mutation({
        query: (runId) => ({
            url: `/admin/hrms/salary-management/runs/${runId}`,
            method: "DELETE"
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),

    /* Submit Payroll for Approval */
    submitPayrollRun: builder.mutation({
        query: (runId) => ({
            url: `/admin/hrms/salary-management/runs/${runId}/submit`,
            method: "POST"
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),

    /* Get Statutory Report */
    getStatutoryReport: builder.query({
        query: (runId) => `/admin/hrms/salary-management/runs/${runId}/statutory`,
        transformResponse: (res) => res?.data || [],
        providesTags: ["StatutoryReport"],
    }),

    /* Make Manual Adjustment */
    createPayrollAdjustment: builder.mutation({
        query: (data) => ({
            url: `/admin/hrms/salary-management/adjustments`,
            method: "POST",
            body: data
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),
    overridePayrollRecord: builder.mutation({
        query: ({ recordId, ...data }) => ({
            url: `/admin/hrms/salary-management/runs/records/${recordId}/override`,
            method: "POST",
            body: data
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),

    // --- SALARY STRUCTURE ---
    getSalaryTemplates: builder.query({
      query: () => "/admin/hrms/salary-management/structure/templates",
      providesTags: ["SalaryStructure"],
    }),
    createSalaryTemplate: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/salary-management/structure/templates",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalaryStructure"],
    }),
    updateSalaryTemplate: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/hrms/salary-management/structure/templates/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SalaryStructure"],
    }),
    deleteSalaryTemplate: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/salary-management/structure/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalaryStructure"],
    }),
    assignSalaryTemplate: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/salary-management/structure/assign",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalaryStructure", "Employees"],
    }),
    
    /* Payouts & History */
    getPayouts: builder.query({
        query: () => "/admin/hrms/salary-management/payouts",
        transformResponse: (res) => res?.data || [],
        providesTags: ["PAYROLL"]
    }),
    updatePayoutStatus: builder.mutation({
        query: ({ runId, ...data }) => ({
            url: `/admin/hrms/salary-management/payouts/${runId}/status`,
            method: "POST",
            body: data
        }),
        invalidatesTags: ["PAYROLL"]
    }),
    updateIndividualPayoutStatus: builder.mutation({
        query: ({ recordId, ...data }) => ({
            url: `/admin/hrms/salary-management/payouts/records/${recordId}/status`,
            method: "POST",
            body: data
        }),
        invalidatesTags: ["PAYROLL", "PAYROLL_RECORDS"]
    }),


  }),
});

export const {
  useGetSalaryManagementQuery,
  useProcessPayrollMutation,
  useGetPayrollRunsQuery,
  useGetPayrollRecordsQuery,
  useLockPayrollRunMutation,
  useDeletePayrollRunMutation,
  useCreatePayrollAdjustmentMutation,
  useOverridePayrollRecordMutation,
  useSubmitPayrollRunMutation,
  useGetStatutoryReportQuery,
  useGetSalaryTemplatesQuery,
  useCreateSalaryTemplateMutation,
  useUpdateSalaryTemplateMutation,
  useDeleteSalaryTemplateMutation,
  useAssignSalaryTemplateMutation,
  useGetPayoutsQuery,
  useUpdatePayoutStatusMutation,
  useUpdateIndividualPayoutStatusMutation
} = salaryManagementApi;