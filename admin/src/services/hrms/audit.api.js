import { baseApi } from "../base/base.api.js";

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({
        url: "/admin/hrms/audit",
        params,
      }),
      providesTags: ["Audit"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
