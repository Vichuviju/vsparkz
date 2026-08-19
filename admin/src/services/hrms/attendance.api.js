import { baseApi, ATTENDANCE, HR_SETTINGS } from "../base/base.api";

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendance: builder.query({
      query: () => "/admin/hrms/attendance",
      providesTags: [ATTENDANCE],
    }),

    createAttendance: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/attendance",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [ATTENDANCE],
    }),

    updateAttendance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/hrms/attendance/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [ATTENDANCE],
    }),

    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/attendance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [ATTENDANCE],
    }),
     // ✅ HR VIEW WITH FILTER + PAGINATION + SUMMARY
    getAllEmployeeAttendance: builder.query({
      query: ({
        dateFrom,
        dateTo,
        sortBy = "date",
        sortOrder = "desc",
        page = 1,
        limit = 50,
        shiftId,
        deptId,
      }) => ({
        url: "/admin/hrms/attendance/allattendancerecord",
        params: {
          dateFrom,
          dateTo,
          sortBy,
          sortOrder,
          page,
          limit,
          shiftId,
          deptId,
        },
      }),
      providesTags: [ATTENDANCE],
    }),

    exportAttendancePdf: builder.query({
      query: (params) => ({
        url: "/admin/hrms/attendance/export-pdf",
        method: "GET",
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    getAttendanceStats: builder.query({
      query: ({ dateFrom, dateTo }) => ({
        url: "/admin/hrms/attendance/stats",
        params: { dateFrom, dateTo },
      }),
      providesTags: [ATTENDANCE],
    }),

    getDashboardStats: builder.query({
      query: ({ dateFrom, dateTo }) => ({
        url: "/admin/hrms/attendance/dashboard-stats",
        params: { dateFrom, dateTo },
      }),
      providesTags: [ATTENDANCE],
    }),

    closeDailyAttendance: builder.mutation({
      query: ({ date }) => ({
        url: "/admin/hrms/attendance/close-daily-attendance",
        method: "POST",
        body: { date },
      }),
      invalidatesTags: (result, error, { date }) => [ATTENDANCE, HR_SETTINGS],
    }),

    biometricSync: builder.mutation({
      query: (punchData) => ({
        url: "/admin/hrms/attendance/biometric-sync",
        method: "POST",
        body: { punchData },
      }),
      invalidatesTags: [ATTENDANCE],
    }),

    getDeviceStatus: builder.query({
      query: () => "/admin/hrms/attendance/device-status",
      providesTags: ["DEVICE_STATUS"],
    }),

    // Biometric Device Management
    getActiveDevice: builder.query({
      query: () => "/admin/hrms/biometric/devices/active",
      providesTags: ["DEVICE_STATUS"],
    }),

    updateDeviceConfig: builder.mutation({
      query: ({ id, ...config }) => ({
        url: `/admin/hrms/biometric/devices/${id}`,
        method: "PUT",
        body: config,
      }),
      invalidatesTags: ["DEVICE_STATUS"],
    }),

    testDeviceConnection: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/biometric/devices/${id}/test-connection`,
        method: "POST",
      }),
      invalidatesTags: ["DEVICE_STATUS"],
    }),

    updateSyncSettings: builder.mutation({
      query: ({ id, ...settings }) => ({
        url: `/admin/hrms/biometric/devices/${id}/sync-settings`,
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["DEVICE_STATUS"],
    }),

    getSyncHistory: builder.query({
      query: ({ deviceId, limit = 50, page = 1 }) => ({
        url: "/admin/hrms/biometric/sync-history",
        params: { deviceId, limit, page },
      }),
      providesTags: ["SYNC_HISTORY"],
    }),

    // Individual Employee
    getIndividualEmployeeAttendance: builder.query({
      query: ({ employeeId, dateFrom, dateTo }) => ({
        url: `/admin/hrms/attendance/by-employee/${employeeId}`,
        params: { dateFrom, dateTo },
      }),
      providesTags: [ATTENDANCE],
    }),
  }),
});



export const {
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  useGetAllEmployeeAttendanceQuery,
  useLazyExportAttendancePdfQuery,
  useGetIndividualEmployeeAttendanceQuery,
  useGetAttendanceStatsQuery,
  useGetDashboardStatsQuery,
  useCloseDailyAttendanceMutation,
  useBiometricSyncMutation,
  useGetDeviceStatusQuery,
  useGetActiveDeviceQuery,
  useUpdateDeviceConfigMutation,
  useTestDeviceConnectionMutation,
  useUpdateSyncSettingsMutation,
  useGetSyncHistoryQuery,
} = attendanceApi;