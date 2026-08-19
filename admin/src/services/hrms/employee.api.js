import { baseApi, EMPLOYEES, ACTIVITY_FEED, EMPLOYEE_DEPARTMENTS } from "../base/base.api";

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    //Add New Employee (HR creates user + employee)
    createEmployee: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/employees",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [EMPLOYEES, ACTIVITY_FEED, EMPLOYEE_DEPARTMENTS],
    }),

    // Get Employee By ID
    getEmployeeById: builder.query({
      query: (id) => ({
        url: `/admin/hrms/employees/${id}`,
        method: "GET",
      }),
      providesTags: [EMPLOYEES],
    }),

    // Get All Employees (list page)
    getAllEmployees: builder.query({
      query: (params) => ({
        url: "/admin/hrms/employees",
        method: "GET",
        params,
      }),
      transformResponse: (response) => response?.data || response,
      providesTags: [EMPLOYEES],
    }),

    // Get Unlinked Users (draft/unlinked list)
    getUnlinkedUsers: builder.query({
      query: () => ({
        url: "/admin/hrms/employees/unlinked-users",
        method: "GET",
      }),
      transformResponse: (response) => response?.data || response,
      providesTags: [EMPLOYEES],
    }),

    // Update Employee
    updateEmployee: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/admin/hrms/employees/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: [EMPLOYEES, ACTIVITY_FEED, EMPLOYEE_DEPARTMENTS],
    }),

    // Delete Employee
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/admin/hrms/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [EMPLOYEES, ACTIVITY_FEED, EMPLOYEE_DEPARTMENTS],
    }),

    // Add Increment
    addIncrement: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/admin/hrms/employees/${id}/increment`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [EMPLOYEES],
    }),

    // Get Salary History
    getSalaryHistory: builder.query({
      query: (id) => ({
        url: `/admin/hrms/employees/${id}/salary-history`,
        method: "GET",
      }),
      providesTags: [EMPLOYEES],
    }),

  }),
});

export const {
  useCreateEmployeeMutation,
  useGetEmployeeByIdQuery,
  useGetAllEmployeesQuery,
  useLazyGetAllEmployeesQuery,
  useGetUnlinkedUsersQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useAddIncrementMutation,
  useGetSalaryHistoryQuery,
} = employeeApi;

