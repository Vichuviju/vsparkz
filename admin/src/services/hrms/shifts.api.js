import { baseApi, SHIFTS, EMPLOYEES, WEEKLY_OFF } from "../base/base.api";

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: () => "/admin/hrms/shifts",
      providesTags: [SHIFTS],
    }),

    createShift: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/shifts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [SHIFTS],
    }),

    updateShift: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/hrms/shifts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [SHIFTS, WEEKLY_OFF],
    }),

    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/shifts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [SHIFTS],
    }),
    
    bulkAssignShift: builder.mutation({
      query: ({ id, employeeIds }) => ({
        url: `/admin/hrms/shifts/${id}/assign`,
        method: "PUT",
        body: { employeeIds },
      }),
      invalidatesTags: [SHIFTS, EMPLOYEES],
    }),
  }),
});

export const {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useBulkAssignShiftMutation,
} = shiftsApi;
