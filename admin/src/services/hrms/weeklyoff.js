import { baseApi, WEEKLY_OFF } from "../base/base.api";

export const weeklyOffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    saveWeeklyOff: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/weeklyoff",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [WEEKLY_OFF],
    }),

    getWeeklyOff: builder.query({
      query: ({ region, month, year, shiftId }) => {
        let url = `/admin/hrms/weeklyoff?month=${month}&year=${year}`;
        if (region && region !== 'all') {
          url += `&region=${region}`;
        }
        if (shiftId && shiftId !== 'all') {
            url += `&shiftId=${shiftId}`;
        }
        return {
          url,
          method: "GET"
        };
      },
      providesTags: [WEEKLY_OFF],
    }),

  }),
});

export const {
  useSaveWeeklyOffMutation,
  useGetWeeklyOffQuery,
} = weeklyOffApi;
