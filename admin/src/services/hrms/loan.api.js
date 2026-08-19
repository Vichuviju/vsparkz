import { baseApi } from "../base/base.api";

export const loanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* ================= GET MY LOANS ================= */
    getMyLoans: builder.query({
      query: ({ page = 1, limit = 10, status } = {}) => {
        let url = `/admin/hrms/loans/my?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Loans", id })),
              { type: "Loans", id: "LIST" },
            ]
          : [{ type: "Loans", id: "LIST" }],
    }),

    /* ================= GET ALL LOANS (Admin) ================= */
    getAllLoans: builder.query({
      query: ({ page = 1, limit = 10, status } = {}) => {
        let url = `/admin/hrms/loans?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Loans", id })),
              { type: "Loans", id: "LIST" },
            ]
          : [{ type: "Loans", id: "LIST" }],
    }),

    /* ================= CREATE LOAN ================= */
    createLoan: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/loans",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Loans", id: "LIST" }, "WorkflowAction"],
    }),

    /* ================= UPDATE STATUS ================= */
    updateLoanStatus: builder.mutation({
      query: ({ id, status, deductionDate, remarks, paymentMode, rejectionReason }) => ({
        url: `/admin/hrms/loans/${id}/status`,
        method: "PATCH",
        body: {
          status,
          deductionDate,
          remarks,
          paymentMode,
          rejectionReason,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
        "WorkflowAction"
      ],
    }),

    /* ================= UPDATE LOAN ================= */
    updateLoan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hrms/loans/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
        "WorkflowAction"
      ],
    }),

    /* ================= DELETE LOAN ================= */
    deleteLoan: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/loans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
        "WorkflowAction"
      ],
    }),

  }),
});

export const {
  useGetMyLoansQuery,
  useGetAllLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanStatusMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
} = loanApi;