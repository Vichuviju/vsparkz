import { baseApi } from "../base/base.api";

export const incentiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncentives: builder.query({
      query: () => "/admin/hrms/incentives",
      transformResponse: (response) => Array.isArray(response) ? response : (response?.data || []),
      providesTags: ["Incentives"],
    }),

    createIncentive: builder.mutation({
      query: (body) => ({
        url: "/admin/hrms/incentives",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),

    createBulkIncentive: builder.mutation({
      query: (body) => ({
        url: "/admin/hrms/incentives/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),

    updateIncentive: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hrms/incentives/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),

    deleteIncentive: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/incentives/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),

    approveIncentive: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/incentives/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),

    rejectIncentive: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/incentives/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Incentives", "WorkflowAction"],
    }),
  }),
})

export const {
  useGetIncentivesQuery,
  useCreateIncentiveMutation,
  useCreateBulkIncentiveMutation,
  useUpdateIncentiveMutation,
  useDeleteIncentiveMutation,
  useApproveIncentiveMutation,
  useRejectIncentiveMutation,
} = incentiveApi