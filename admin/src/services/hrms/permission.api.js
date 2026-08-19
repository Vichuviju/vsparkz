import { baseApi } from "../base/base.api";

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ✅ Employee - My Permissions
    getMyPermissions: builder.query({
      query: ({ page = 1, limit = 10, status }) => {
        let url = `/admin/hrms/permissions/my?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Permissions", id })),
              { type: "Permissions", id: "LIST" },
            ]
          : [{ type: "Permissions", id: "LIST" }],
    }),

    // ✅ Admin - All Permissions
    getAllPermissions: builder.query({
      query: ({ page = 1, limit = 10, status }) => {
        let url = `/admin/hrms/permissions?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Permissions", id })),
              { type: "Permissions", id: "LIST" },
            ]
          : [{ type: "Permissions", id: "LIST" }],
    }),

    // ✅ Create
    createPermission: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Permissions", id: "LIST" }, "WorkflowAction"],
    }),

    // ✅ Approve / Reject
    updatePermissionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/hrms/permissions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Permissions", id },
        { type: "Permissions", id: "LIST" },
        "WorkflowAction"
      ],
    }),

    // ✅ Delete
    deletePermission: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Permissions", id },
        { type: "Permissions", id: "LIST" },
        "WorkflowAction"
      ],
    }),
    updatePermission: builder.mutation({
        query: ({ id, ...body }) => ({
            url: `/admin/hrms/permissions/${id}`,
            method: "PUT",
            body,
        }),
        invalidatesTags: ["Permission", "WorkflowAction"],
    }),


  }),
});

export const {
  useGetMyPermissionsQuery,
  useGetAllPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionStatusMutation,
  useDeletePermissionMutation,
  useUpdatePermissionMutation
} = permissionsApi;
