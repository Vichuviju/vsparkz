import { baseApi, HR_SETTINGS } from "../base/base.api";

export const hrSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHrSettings: builder.query({
      query: () => "/admin/hrms/settings",
      providesTags: [HR_SETTINGS],
    }),

    saveHrSettings: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/settings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [HR_SETTINGS],
    }),

    /**
     * Sends page HTML content to the backend Puppeteer engine.
     * Returns a Blob URL so the PDF can be previewed or downloaded in the browser.
     */
    generateOfferLetterPdf: builder.mutation({
      query: (data) => ({
        url: "/admin/hrms/settings/offer-letter/generate-pdf",
        method: "POST",
        body: data,
        responseHandler: async (response) => {
          // The backend returns a raw binary PDF — convert to a Blob URL
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        },
        // Do NOT try to JSON-parse this response
        validateStatus: (response) => response.status === 200,
      }),
    }),
  }),
});

export const {
  useGetHrSettingsQuery,
  useSaveHrSettingsMutation,
  useGenerateOfferLetterPdfMutation,
} = hrSettingsApi;
