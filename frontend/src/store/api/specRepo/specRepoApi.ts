import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
    fetchContracts,
    fetchSpecRefs,
    GithubError,
    type FetchedContracts,
    type SpecRef,
} from "@pages/protocol-studio/ui/editor/contracts/github";

/** The error every endpoint rejects with: a message, and why (rate limit, not found, network). */
export interface ISpecRepoError {
    status: "CUSTOM_ERROR";
    error: string;
    code?: GithubError["code"];
}

const toError = (error: unknown): ISpecRepoError => ({
    status: "CUSTOM_ERROR",
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof GithubError ? error.code : undefined,
});

/**
 * Protocol Studio's reads of the specs repo on GitHub: the branch list, and a
 * branch's contract files at one commit. Files are immutable per commit, so
 * they stay cached for the hour; the branch list is re-read on Refresh.
 */
export const specRepoApi = createApi({
    reducerPath: "specRepoApi",
    // External GitHub URLs — no app auth interceptor.
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    tagTypes: ["SpecRepoRefs"],
    endpoints: (builder) => ({
        getSpecRepoRefs: builder.query<SpecRef[], { repo: string }>({
            async queryFn({ repo }) {
                try {
                    return { data: await fetchSpecRefs(repo) };
                } catch (error) {
                    return { error: toError(error) };
                }
            },
            providesTags: ["SpecRepoRefs"],
            keepUnusedDataFor: 10 * 60,
        }),
        getSpecContracts: builder.query<
            FetchedContracts,
            { repo: string; branch: string; sha: string }
        >({
            async queryFn({ repo, branch, sha }) {
                try {
                    return { data: await fetchContracts(repo, branch, sha) };
                } catch (error) {
                    return { error: toError(error) };
                }
            },
            keepUnusedDataFor: 60 * 60,
        }),
    }),
});

export const { useGetSpecRepoRefsQuery, useGetSpecContractsQuery, useLazyGetSpecContractsQuery } =
    specRepoApi;

export default specRepoApi;
