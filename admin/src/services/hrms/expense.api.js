import { baseApi } from "../base/base.api";

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL (with pagination)
    getExpenses: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => "/admin/hrms/expenses?page="+page+"&limit="+limit,
      transformResponse: (response) => ({
        data: response?.data || [],
        total: response?.total || 0,
        page: response?.page || 1,
        limit: response?.limit || 10,
      }),
      providesTags: ["Expenses"],
    }),

    // GET MY EXPENSES
    getMyExpenses: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => "/admin/hrms/expenses/my?page="+page+"&limit="+limit,
      transformResponse: (response) => ({
        data: response?.data || [],
        total: response?.total || 0,
        page: response?.page || 1,
        limit: response?.limit || 10,
      }),
      providesTags: ["Expenses"],
    }),

    // CHECK IF USER CAN APPROVE EXPENSE
    canApproveExpense: builder.query({
      query: (id) => `/admin/hrms/expenses/${id}/can-approve`,
      transformResponse: (response) => response?.canApprove || false,
      providesTags: ["Expenses"],
    }),

    // CREATE
    createExpenses: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/expenses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    updateExpenses: builder.mutation({
        query: ({ id, data }) => ({
            url: `/admin/hrms/expenses/${id}`,
            method: "PUT",
            body: data,
        }),
        invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // MANAGER APPROVE
    managerApprove: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/expenses/${id}/manager-approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // MANAGER REJECT
    managerReject: builder.mutation({
      query: ({ id, remark }) => ({
        url: `/admin/hrms/expenses/${id}/manager-reject`,
        method: "PUT",
        body: { remark },
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // HR APPROVE
    hrApprove: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/expenses/${id?.id || id}/hr-approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // HR REJECT
    hrReject: builder.mutation({
      query: ({ id, remark }) => ({
        url: `/admin/hrms/expenses/${id}/hr-reject`,
        method: "PUT",
        body: { remark },
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // MARK PAID
    markAsPaid: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/expenses/${id}/mark-paid`,
        method: "PUT",
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // GENERIC APPROVE
    approveExpense: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/expenses/${id}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // GENERIC REJECT
    rejectExpense: builder.mutation({
      query: ({ id, remark }) => ({
        url: `/admin/hrms/expenses/${id}/reject`,
        method: "PUT",
        body: { remark },
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

    // DELETE
    deleteExpenses: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expenses", "WorkflowAction"],
    }),

  }),
});

export const {
  useGetExpensesQuery,
  useGetMyExpensesQuery,
  useCanApproveExpenseQuery,
  useCreateExpensesMutation,
  useUpdateExpensesMutation,
  useManagerApproveMutation,
  useManagerRejectMutation,
  useHrApproveMutation,
  useHrRejectMutation,
  useMarkAsPaidMutation,
  useDeleteExpensesMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} = expenseApi;