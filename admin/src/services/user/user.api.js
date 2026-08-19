import { baseApi } from "../base/base.api";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ✅ Dropdown search (for manager select)
    getUsersDropdown: builder.query({
      query: (search = "") => ({
        url: `/user/dropdown`,
        method: "GET",
        params: { search }, // cleaner than string concat
      }),
    }),

    // ✅ Profile
    getProfile: builder.query({
      query: () => ({
        url: "/user/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // ✅ Update profile
    updateProfile: builder.mutation({
      query: (profile) => ({
        url: "/user/profile",
        method: "PUT",
        body: profile,
      }),
      invalidatesTags: ["User"],
    }),

    // ✅ Admin users
    getAdminUsers: builder.query({
      query: () => ({
        url: "/user/admins",
        method: "GET",
      }),
    }),

    // ✅ All users with pagination + filters
    getAllUsersList: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        roleId = "",
      } = {}) => ({
        url: "/user/all",
        method: "GET",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(roleId && { roleId }),
        },
      }),
      providesTags: ["User"],
    }),
    getAllUsersNoLimit: builder.query({
      query: () => ({
        url: "/user/all-no-limit",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  

  }),
});

export const {
  // dropdown
  useGetUsersDropdownQuery,
  useLazyGetUsersDropdownQuery,   // ✅ important for search input

  // profile
  useGetProfileQuery,
  useUpdateProfileMutation,

  // users
  useGetAdminUsersQuery,
  useGetAllUsersListQuery,
  useGetAllUsersNoLimitQuery, 

} = userApi;

