import { baseApi } from "../base/base.api";

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ✅ Apply Leave
    applyLeave: builder.mutation({
      query: (leaveData) => ({
        url: "/admin/hrms/leave/apply",
        method: "POST",
        body: leaveData,
      }),
      invalidatesTags: ["Leave", "WorkflowAction"],
    }),

    updateLeave: builder.mutation({
      query: ({ id, ...leaveData }) => ({
        url: `/admin/hrms/leave/${id}`,
        method: "PUT",
        body: leaveData,
      }),
      invalidatesTags: ["Leave", "WorkflowAction"],
    }),

    deleteLeave: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/leave/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leave", "WorkflowAction"],
    }),


    // ✅ Get My Leaves (Logged-in user)
    getMyLeaves: builder.query({
      query: ({
        page = 1,
        limit = 10,
        status = "",
      } = {}) => ({
        url: "/admin/hrms/leave/my",
        method: "GET",
        params: {
          page,
          limit,
          ...(status && { status }),
        },
      }),
      providesTags: ["Leave"],
    }),

    // ✅ Get All Leaves (Admin / HR)
    getAllLeaves: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
      } = {}) => ({
        url: "/admin/hrms/leave/all",
        method: "GET",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(status && { status }),
        },
      }),
      providesTags: ["Leave"],
    }),

    // ✅ Update Leave Status (Approve / Reject)
    updateLeaveStatus: builder.mutation({
      query: ({ leaveId, status }) => ({
        url: `/admin/hrms/leave/status/${leaveId}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Leave", "WorkflowAction"],
    }),

    getMyLeaveBalance: builder.query({
      query: () => ({
        url: "/admin/hrms/leave/balance",
        method: "GET",
      }),
      providesTags: ["LeaveBalance"],
    }),

    getAllLeaveBalances: builder.query({
      query: (params = {}) => ({
        url: "/admin/hrms/leave/all-balances",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || "",
        },
      }),
      providesTags: ["LeaveBalance"],
    }),

    adjustLeaveBalance: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/leave/adjust-balance",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LeaveBalance"],
    }),

  }),
});

export const {
  // mutations
  useApplyLeaveMutation,
  useUpdateLeaveMutation,   // 👈 add this
  useDeleteLeaveMutation,   
  useUpdateLeaveStatusMutation,

  // queries
  useGetMyLeavesQuery,
  useGetAllLeavesQuery,
  useGetMyLeaveBalanceQuery,
  useGetAllLeaveBalancesQuery,
  useAdjustLeaveBalanceMutation
} = leaveApi;

