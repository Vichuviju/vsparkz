import { baseApi } from "../base/base.api";

export const statutoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    /* Get Current Settings for PF or ESI */
    getStatutorySettings: builder.query({
      query: ({ type, date }) => ({
        url: `/admin/hrms/statutory/settings/${type}`,
        params: date ? { date } : undefined
      }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, { type }) => [{ type: "STATUTORY_SETTINGS", id: type }]
    }),
    
    /* Get All Settings (Admin) */
    getAllStatutorySettings: builder.query({
      query: () => "/admin/hrms/statutory/settings",
      transformResponse: (response) => response?.data || [],
      providesTags: ["STATUTORY_SETTINGS"]
    }),
    
    /* Create New Settings */
    createStatutorySettings: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/statutory/settings",
        method: "POST",
        body: data
      }),
      invalidatesTags: ["STATUTORY_SETTINGS"]
    }),
    
    /* Update Settings */
    updateStatutorySettings: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/hrms/statutory/settings/${id}`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ["STATUTORY_SETTINGS"]
    }),
    
    /* Calculate Contributions (Preview) */
    calculateContributions: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/statutory/calculate",
        method: "POST",
        body: data
      })
    }),
    
    /* Get Period Summary */
    getPeriodSummary: builder.query({
      query: ({ year, month }) => ({
        url: "/admin/hrms/statutory/summary",
        params: { year, month }
      }),
      transformResponse: (response) => response?.data
    })
    
  })
});

export const {
  useGetStatutorySettingsQuery,
  useGetAllStatutorySettingsQuery,
  useCreateStatutorySettingsMutation,
  useUpdateStatutorySettingsMutation,
  useCalculateContributionsMutation,
  useGetPeriodSummaryQuery
} = statutoryApi;
