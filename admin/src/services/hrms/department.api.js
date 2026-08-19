import { baseApi } from "../base/base.api";
import { EMPLOYEE_DEPARTMENTS } from "../base/base.api";

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get all departments
    getAllDepartments: builder.query({
      query: () => ({
        url: "/admin/hrms/departments",
        method: "GET",
      }),
      providesTags: [EMPLOYEE_DEPARTMENTS],
    }),

    // ✅ Get department by ID
    getDepartmentById: builder.query({
      query: (id) => ({
        url: `/admin/hrms/departments/${id}`,
        method: "GET",
      }),
      providesTags: [EMPLOYEE_DEPARTMENTS],
    }),
    // create department
     createEmployeeDepartment: builder.mutation({
      query: (payload) => ({
        url: "/admin/hrms/departments",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [EMPLOYEE_DEPARTMENTS],
    }),

    getDepartmentsWithEmployees: builder.query({
      query: () => ({
        url: "/admin/hrms/departments/with-employees",
        method: "GET",
      }),
      providesTags: [EMPLOYEE_DEPARTMENTS],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateEmployeeDepartmentMutation,
  useGetDepartmentsWithEmployeesQuery,
} = departmentApi;

