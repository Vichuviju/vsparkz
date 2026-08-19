import { baseApi } from "../base/base.api";

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ✅ CREATE
    createLeaveConfig: builder.mutation({
      query: (configData) => ({
        url: "/admin/hrms/leave-config",
        method: "POST",
        body: configData,
      }),
      invalidatesTags: ["LeaveConfig"],
    }),

    // ✅ GET ALL
    getLeaveConfigs: builder.query({
      query: () => ({
        url: "/admin/hrms/leave-config",
        method: "GET",
      }),
      providesTags: ["LeaveConfig"],
    }),

    // ✅ UPDATE
    updateLeaveConfig: builder.mutation({
      query: ({ id, ...configData }) => ({
        url: `/admin/hrms/leave-config/${id}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["LeaveConfig"],
    }),

    // ✅ DELETE
    deleteLeaveConfig: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/leave-config/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeaveConfig"],
    }),

  }),

  overrideExisting: false,
});

export const {
  useCreateLeaveConfigMutation,
  useGetLeaveConfigsQuery,
  useUpdateLeaveConfigMutation,
  useDeleteLeaveConfigMutation,
} = leaveApi;
