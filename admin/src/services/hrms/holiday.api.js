import { baseApi } from "../base/base.api";

export const holidayApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ===============================
    // ✅ CREATE LEAVE
    // ===============================
    createHoliday: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/holiday",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Leave"],
    }),

    // ===============================
    // ✅ UPDATE LEAVE
    // ===============================
    updateHoliday: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/hrms/holiday/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Leave"],
    }),

    // ===============================
    // ✅ DELETE LEAVE
    // ===============================
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/holiday/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leave"],
    }),

    // ===============================
    // ✅ LIST LEAVES (With Pagination + Filter)
    // ===============================
    getHoliday: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
      } = {}) => ({
        url: "/admin/hrms/holiday",
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

  }),
});

export const {
  // Mutations
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,

  // Query
  useGetHolidayQuery,

} = holidayApi;
