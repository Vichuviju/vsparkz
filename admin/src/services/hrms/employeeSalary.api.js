import { baseApi, EMPLOYEES, ACTIVITY_FEED } from "../base/base.api";

export const salaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSalaries: builder.query({
      query: () => "/admin/hrms/salaries",
      providesTags: ["Salaries"],
    }),

    getMySalary: builder.query({
      query: () => "/admin/hrms/salaries/my",
      providesTags: ["Salaries"],
    }),
  }),
})

export const {
  useGetAllSalariesQuery,
  useGetMySalaryQuery,
} = salaryApi