import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import type {
    IGenerateMcpKeyRequest,
    IGenerateMcpKeyResponse,
    IMcpKeyStatus,
    IRevokeMcpKeyResponse,
} from "./types";

/** There is one key per user, so a single cache entry is the whole collection. */
const SELF = "SELF";

export const mcpKeyApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getMcpKeyStatus: builder.query<IMcpKeyStatus, void>({
            query: () => ({ url: API_ROUTES.MCP_KEY.BASE, method: "GET" }),
            providesTags: [{ type: "McpKey", id: SELF }],
        }),
        /**
         * Issues a key, replacing any the user already holds.
         *
         * The resolved value contains the plaintext key and is the only chance
         * to show it. Do not write it to Redux, redux-persist or localStorage —
         * hold it in component state and drop it when the reveal closes.
         */
        generateMcpKey: builder.mutation<IGenerateMcpKeyResponse, IGenerateMcpKeyRequest>({
            query: (payload) => ({
                url: API_ROUTES.MCP_KEY.BASE,
                method: "POST",
                data: payload,
            }),
            invalidatesTags: [{ type: "McpKey", id: SELF }],
        }),
        revokeMcpKey: builder.mutation<IRevokeMcpKeyResponse, void>({
            query: () => ({ url: API_ROUTES.MCP_KEY.BASE, method: "DELETE" }),
            invalidatesTags: [{ type: "McpKey", id: SELF }],
        }),
    }),
});

export const { useGetMcpKeyStatusQuery, useGenerateMcpKeyMutation, useRevokeMcpKeyMutation } =
    mcpKeyApi;
