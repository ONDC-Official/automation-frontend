import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import type {
    ICommentPayload,
    ICommentResponse,
    IReplyPayload,
    ICommentsListParams,
} from "./types";

// Same composite-key rationale as notes.ts — comments lists are scoped by
// use_case_id+flow_id+action_id together, not a single field.
const listId = (params: ICommentsListParams) =>
    `LIST-${params.use_case_id ?? ""}-${params.flow_id ?? ""}-${params.action_id ?? ""}`;

const buildCommentsUrl = (params: ICommentsListParams) => {
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    const query = search.toString();
    return query ? `${API_ROUTES.COMMENTS.BASE}?${query}` : API_ROUTES.COMMENTS.BASE;
};

export const commentsApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getComments: builder.query<ICommentResponse[], ICommentsListParams>({
            query: (params) => ({ url: buildCommentsUrl(params), method: "GET" }),
            providesTags: (result, _err, params) => [
                { type: "Comment", id: listId(params) },
                ...(result ?? []).map((c) => ({ type: "Comment" as const, id: c._id })),
            ],
        }),
        createComment: builder.mutation<ICommentResponse, ICommentPayload>({
            query: (payload) => ({
                url: API_ROUTES.COMMENTS.BASE,
                method: "POST",
                data: payload,
            }),
            invalidatesTags: (_result, _err, payload) => [{ type: "Comment", id: listId(payload) }],
        }),
        replyToComment: builder.mutation<ICommentResponse, IReplyPayload>({
            query: (payload) => ({
                url: API_ROUTES.COMMENTS.BASE,
                method: "POST",
                data: payload,
            }),
            invalidatesTags: (_result, _err, payload) => [{ type: "Comment", id: listId(payload) }],
        }),
        resolveComment: builder.mutation<
            ICommentResponse,
            { commentId: string; resolved: boolean }
        >({
            query: ({ commentId, resolved }) => ({
                url: API_ROUTES.COMMENTS.RESOLVE(commentId),
                method: "PUT",
                data: { resolved },
            }),
        }),
        getCommentById: builder.query<ICommentResponse, string>({
            query: (commentId) => ({ url: API_ROUTES.COMMENTS.BY_ID(commentId), method: "GET" }),
            providesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
        }),
        deleteComment: builder.mutation<unknown, string>({
            query: (commentId) => ({ url: API_ROUTES.COMMENTS.BY_ID(commentId), method: "DELETE" }),
        }),
    }),
});

export const {
    useGetCommentsQuery,
    useLazyGetCommentsQuery,
    useCreateCommentMutation,
    useReplyToCommentMutation,
    useResolveCommentMutation,
    useGetCommentByIdQuery,
    useDeleteCommentMutation,
} = commentsApi;
