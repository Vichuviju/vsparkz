import { baseApi } from "@/services/base/base.api";

export const rbacApi = baseApi.injectEndpoints({
    tagTypes: ["RBAC"],
    endpoints: (builder) => ({
        getRBACRoles: builder.query({
            query: () => "/rbac/roles",
            providesTags: ["RBAC"],
        }),
        getRolePermissionMatrix: builder.query({
            query: (roleId) => `/rbac/permissions/${roleId}`,
            providesTags: ["RBAC"],
        }),
        updateRolePermissions: builder.mutation({
            query: ({ roleId, permissions, reason }) => ({
                url: `/rbac/permissions/${roleId}`,
                method: "PUT",
                body: { permissions, reason },
            }),
            invalidatesTags: ["RBAC"],
        }),
        createRole: builder.mutation({
            query: (role) => ({
                url: "/rbac/roles",
                method: "POST",
                body: role,
            }),
            invalidatesTags: ["RBAC"],
        }),
        deleteRole: builder.mutation({
            query: (roleId) => ({
                url: `/rbac/roles/${roleId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["RBAC"],
        }),
        registerModule: builder.mutation({
            query: (moduleData) => ({
                url: "/rbac/modules",
                method: "POST",
                body: moduleData,
            }),
            invalidatesTags: ["RBAC"],
        }),
    }),
});

export const { 
    useGetRBACRolesQuery, 
    useGetRolePermissionMatrixQuery, 
    useUpdateRolePermissionsMutation,
    useCreateRoleMutation,
    useDeleteRoleMutation,
    useRegisterModuleMutation
} = rbacApi;
