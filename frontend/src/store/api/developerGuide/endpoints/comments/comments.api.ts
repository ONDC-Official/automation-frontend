import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import { buildScopedListId, buildScopedListUrl } from "@store/api/shared/scopedListParams";
import type {
    ICommentPayload,
    ICommentResponse,
    IReplyPayload,
    ICommentsListParams,
} from "./types";

const listId = (params: ICommentsListParams) => buildScopedListId(params);

const buildCommentsUrl = (params: ICommentsListParams) =>
    buildScopedListUrl(API_ROUTES.COMMENTS.BASE, params);

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
            invalidatesTags: (_result, _err, { commentId }) => [{ type: "Comment", id: commentId }],
        }),
        getCommentById: builder.query<ICommentResponse, string>({
            query: (commentId) => ({ url: API_ROUTES.COMMENTS.BY_ID(commentId), method: "GET" }),
            providesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
        }),
        deleteComment: builder.mutation<unknown, string>({
            query: (commentId) => ({ url: API_ROUTES.COMMENTS.BY_ID(commentId), method: "DELETE" }),
            invalidatesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
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
