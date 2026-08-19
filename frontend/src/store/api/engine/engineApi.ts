import { createApi } from "@reduxjs/toolkit/query/react";
import { mcpEngineClient } from "@services/mcpEngineClient";
import { axiosBaseQuery } from "@store/api/shared/axiosBaseQuery";

/**
 * A sixth API slice, for a backend this app does not own.
 *
 * Every other slice targets one fixed `VITE_*` URL. This one targets whichever
 * `ondc-mcp` engine the current link names, so its endpoints take the engine
 * origin and token as arguments and build absolute URLs — which is also what
 * makes the cache keys correct when somebody opens two engines in two tabs.
 *
 * The client underneath carries no interceptors and no credentials on purpose.
 * See `services/mcpEngineClient.ts`.
 */
export const engineApi = createApi({
    reducerPath: "engineApi",
    baseQuery: axiosBaseQuery(mcpEngineClient),
    tagTypes: ["EngineSession", "EngineFlow", "EnginePayload", "EngineData"],
    endpoints: () => ({}),
});

export default engineApi;
