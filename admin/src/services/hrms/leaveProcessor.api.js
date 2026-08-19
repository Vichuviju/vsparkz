import { baseApi } from "../base/base.api";

export const leaveProcessorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Get current leave cycle setting ──
    getLeaveCycle: builder.query({
      query: () => "/admin/hrms/leave-processing/cycle",
      providesTags: ["LeaveCycle"],
    }),

    // ── Set leave cycle ──
    setLeaveCycle: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/leave-processing/cycle",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["LeaveCycle"],
    }),

    // ── Processing history ──
    getLeaveProcessingHistory: builder.query({
      query: () => "/admin/hrms/leave-processing/history",
      providesTags: ["LeaveProcessingHistory"],
    }),

    // ── Preview monthly accrual ──
    previewMonthlyAccrual: builder.query({
      query: ({ month, year }) =>
        `/admin/hrms/leave-processing/accrual/preview?month=${month}&year=${year}`,
    }),

    // ── Apply monthly accrual ──
    applyMonthlyAccrual: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/leave-processing/accrual/apply",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LeaveProcessingHistory", "LeaveBalance"],
    }),

    // ── Preview yearly rollover ──
    previewYearlyRollover: builder.query({
      query: ({ fromYear }) =>
        `/admin/hrms/leave-processing/rollover/preview?fromYear=${fromYear}`,
    }),

    // ── Apply yearly rollover ──
    applyYearlyRollover: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/leave-processing/rollover/apply",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LeaveProcessingHistory", "LeaveBalance"],
    }),

    // ── Delete history record (to allow re-processing) ──
    deleteProcessingHistory: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/leave-processing/history/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeaveProcessingHistory"],
    }),

    // ── Automation settings ──
    getAutomationSettings: builder.query({
      query: () => "/admin/hrms/leave-processing/automation",
      providesTags: ["LeaveAutomationSettings"],
    }),

    updateAutomationSettings: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/leave-processing/automation",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["LeaveAutomationSettings", "LeaveAutomationStatus"],
    }),

    // ── Automation status ──
    getAutomationStatus: builder.query({
      query: () => "/admin/hrms/leave-processing/automation/status",
      providesTags: ["LeaveAutomationStatus", "LeaveLocks"],
    }),

    enableAutomation: builder.mutation({
      query: () => ({
        url: "/admin/hrms/leave-processing/automation/enable",
        method: "POST",
      }),
      invalidatesTags: ["LeaveAutomationSettings", "LeaveAutomationStatus"],
    }),

    disableAutomation: builder.mutation({
      query: ({ hours }) => ({
        url: "/admin/hrms/leave-processing/automation/disable",
        method: "POST",
        body: { hours },
      }),
      invalidatesTags: ["LeaveAutomationSettings", "LeaveAutomationStatus"],
    }),

    // ── Active lock monitor ──
    getLeaveProcessingLocks: builder.query({
      query: () => "/admin/hrms/leave-processing/locks",
      providesTags: ["LeaveLocks"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetLeaveCycleQuery,
  useSetLeaveCycleMutation,
  useGetLeaveProcessingHistoryQuery,
  useLazyPreviewMonthlyAccrualQuery,
  useApplyMonthlyAccrualMutation,
  useLazyPreviewYearlyRolloverQuery,
  useApplyYearlyRolloverMutation,
  useDeleteProcessingHistoryMutation,
  useGetAutomationSettingsQuery,
  useUpdateAutomationSettingsMutation,
  useGetAutomationStatusQuery,
  useEnableAutomationMutation,
  useDisableAutomationMutation,
  useGetLeaveProcessingLocksQuery,
} = leaveProcessorApi;
