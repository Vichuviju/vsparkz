import { baseApi } from "../base/base.api.js";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getNotifications: builder.query({
      query: () => ({
        url: "/notification",
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    readNotification: builder.mutation({
      query: (id) => ({
        url: `/notification/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

  }),
});

export const {
    useGetNotificationsQuery,
    useReadNotificationMutation,
} = notificationApi;