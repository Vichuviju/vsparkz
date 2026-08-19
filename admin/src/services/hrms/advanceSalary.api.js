import { baseApi } from "../base/base.api";

export const advanceSalaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* ================= CREATE ================= */
    createAdvanceSalary: builder.mutation({
      query: (body) => ({
        url: "/admin/hrms/advance-salary",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdvanceSalary"],
    }),

    /* ================= GET ALL (ADMIN) ================= */
    getAllAdvanceSalary: builder.query({
      query: () => ({
        url: "/admin/hrms/advance-salary",
        method: "GET",
      }),
      providesTags: ["AdvanceSalary"],
    }),

    /* ================= GET MY (EMPLOYEE) ================= */
    getMyAdvanceSalary: builder.query({
      query: () => ({
        url: "/admin/hrms/advance-salary/my",
        method: "GET",
      }),
      providesTags: ["AdvanceSalary"],
    }),

    /* ================= UPDATE ================= */
    updateAdvanceSalary: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/hrms/advance-salary/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AdvanceSalary"],
    }),

    /* ================= DELETE ================= */
    deleteAdvanceSalary: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/advance-salary/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdvanceSalary"],
    }),

    /* ================= UPDATE ADVANCE SALARY STATUS ================= */
updateAdvanceSalaryStatus: builder.mutation({
  query: ({ id, status, deductionDate, remarks, rejectionReason }) => ({
    url: `/admin/hrms/advance-salary/${id}/status`,
    method: "PATCH",
    body: {
          status,
          deductionDate,
          remarks,
          rejectionReason,
        },
  }),
  invalidatesTags: (result, error, { id }) => [
    { type: "AdvanceSalary", id },
    { type: "AdvanceSalary", id: "LIST" },
  ],
}),

  }),
})

export const {
  useCreateAdvanceSalaryMutation,
  useGetAllAdvanceSalaryQuery,
  useGetMyAdvanceSalaryQuery,
  useUpdateAdvanceSalaryMutation,
  useDeleteAdvanceSalaryMutation,
  useUpdateAdvanceSalaryStatusMutation
} = advanceSalaryApi