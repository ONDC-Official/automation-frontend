import { API_ROUTES } from "@services/apiRoutes";
import type { SubscriberData } from "@/types/apiShared/registry";
import { mainApi } from "@store/api/main/mainApi";
import type {
    ISubscribeSellerParams,
    IUpdateSubscriberParams,
    IDeleteSubscriberParams,
    IGenerateApiKeysResponse,
    IRawLookupResponse,
} from "./types";

export const registryApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        subscribeSeller: builder.mutation<unknown, ISubscribeSellerParams>({
            query: ({ participantId, subscriberData }) => ({
                url: API_ROUTES.AUTH.SUBSCRIBE,
                method: "POST",
                data: {
                    participant_id: participantId,
                    ...subscriberData,
                    request_id: `request-${new Date().toISOString()}`,
                },
            }),
            invalidatesTags: (_result, _err, { participantId }) => [
                { type: "Subscriber", id: participantId },
            ],
        }),
        updateSubscriber: builder.mutation<unknown, IUpdateSubscriberParams>({
            query: ({ participantId, data }) => ({
                url: API_ROUTES.AUTH.SUBSCRIBE,
                method: "PATCH",
                data: {
                    participant_id: participantId,
                    ...data,
                    request_id: `request-${new Date().toISOString()}`,
                },
            }),
            invalidatesTags: (_result, _err, { participantId }) => [
                { type: "Subscriber", id: participantId },
            ],
        }),
        deleteSubscriber: builder.mutation<unknown, IDeleteSubscriberParams>({
            query: ({ participantId, deleteData }) => ({
                url: API_ROUTES.AUTH.SUBSCRIBE,
                method: "DELETE",
                data: {
                    participant_id: participantId,
                    ...deleteData,
                    request_id: `request-${new Date().toISOString()}`,
                },
            }),
            invalidatesTags: (_result, _err, { participantId }) => [
                { type: "Subscriber", id: participantId },
            ],
        }),
        lookupSubscriber: builder.query<SubscriberData, { participantId: string }>({
            query: ({ participantId }) => ({
                url: API_ROUTES.AUTH.LOOKUP,
                method: "POST",
                data: { participant_id: participantId },
            }),
            transformResponse: (raw: IRawLookupResponse) => {
                const locations = raw.locations || [];
                const uris = raw.uris || [];

                return {
                    keys: raw.keys,
                    mappings: raw.mappings.map((mapping: Record<string, unknown>) => ({
                        id: mapping.id,
                        domain: mapping.domain,
                        type: mapping.type,
                        uri:
                            uris.find((u: { id: string; uri: string }) => u.id === mapping.uri_id)
                                ?.uri || "",
                        location_country:
                            locations.find(
                                (l: { id: string; country: string[]; city: string[] }) =>
                                    l.id === mapping.location_id
                            )?.country[0] || "",
                        location_city: locations.find(
                            (l: { id: string; country: string[]; city: string[] }) =>
                                l.id === mapping.location_id
                        )?.city || ["*"],
                    })),
                } as SubscriberData;
            },
            providesTags: (_result, _err, { participantId }) => [
                { type: "Subscriber", id: participantId },
            ],
        }),
        generateApiKeys: builder.query<IGenerateApiKeysResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.GENERATE_KEYS,
                method: "GET",
            }),
        }),
        sellerOnSearch: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
            query: (payload) => ({
                url: API_ROUTES.SELLER.ON_SEARCH,
                method: "POST",
                data: payload,
            }),
        }),
    }),
});

export const {
    useSubscribeSellerMutation,
    useUpdateSubscriberMutation,
    useDeleteSubscriberMutation,
    useLazyLookupSubscriberQuery,
    useLazyGenerateApiKeysQuery,
    useSellerOnSearchMutation,
} = registryApi;
