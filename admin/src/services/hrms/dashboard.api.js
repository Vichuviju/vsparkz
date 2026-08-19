import { baseApi } from "../base/base.api.js";

export const hrmsDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHrmsSummary: builder.query({
      query: (date) => ({
        url: "/admin/hrms/dashboard/summary",
        params: date ? { date } : {},
      }),
      providesTags: ["HRMS"],
    }),
    nudgeEmployee: builder.mutation({
      query: (employeeId) => ({
        url: "/admin/hrms/dashboard/nudge",
        method: "POST",
        body: { employeeId },
      }),
    }),
  }),
});

export const { useGetHrmsSummaryQuery, useNudgeEmployeeMutation } = hrmsDashboardApi;
