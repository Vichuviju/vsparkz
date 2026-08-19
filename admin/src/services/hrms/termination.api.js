import { baseApi } from "../base/base.api";

export const terminationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        initiateTermination: builder.mutation({
            query: (data) => ({
                url: "/admin/hrms/termination/initiate",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Employees", "WorkflowAction"],
        }),
        getPendingTerminations: builder.query({
            query: () => ({
                url: "/admin/hrms/termination/pending",
                method: "GET",
            }),
            providesTags: ["WorkflowAction"],
        }),
        getSettlementPreview: builder.query({
            query: (employeeId) => `/admin/hrms/termination/${employeeId}/settlement-preview`,
            providesTags: ["TerminationSettlement"],
        }),
        finalizeSettlement: builder.mutation({
            query: (data) => ({
                url: "/admin/hrms/termination/finalize-settlement",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Employees", "TerminationSettlement", "WorkflowAction"],
        }),
    }),
});

export const {
    useInitiateTerminationMutation,
    useGetPendingTerminationsQuery,
    useGetSettlementPreviewQuery,
    useFinalizeSettlementMutation,
} = terminationApi;
