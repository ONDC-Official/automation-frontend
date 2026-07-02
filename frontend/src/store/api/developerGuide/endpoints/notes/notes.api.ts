import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import { buildScopedListId, buildScopedListUrl } from "@store/api/shared/scopedListParams";
import type { INotePayload, INoteResponse, INotesListParams } from "./types";

const listId = (params: INotesListParams) => buildScopedListId(params);

const buildNotesUrl = (params: INotesListParams) =>
    buildScopedListUrl(API_ROUTES.NOTES.BASE, params);

export const notesApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getNotes: builder.query<INoteResponse[], INotesListParams>({
            query: (params) => ({ url: buildNotesUrl(params), method: "GET" }),
            providesTags: (result, _err, params) => [
                { type: "Note", id: listId(params) },
                ...(result ?? []).map((n) => ({ type: "Note" as const, id: n._id })),
            ],
        }),
        createNote: builder.mutation<INoteResponse, INotePayload>({
            query: (payload) => ({ url: API_ROUTES.NOTES.BASE, method: "POST", data: payload }),
            invalidatesTags: (_result, _err, payload) => [{ type: "Note", id: listId(payload) }],
        }),
        updateNote: builder.mutation<INoteResponse, { noteId: string; payload: INotePayload }>({
            query: ({ noteId, payload }) => ({
                url: API_ROUTES.NOTES.BY_ID(noteId),
                method: "PUT",
                data: payload,
            }),
        }),
        deleteNote: builder.mutation<unknown, string>({
            query: (noteId) => ({ url: API_ROUTES.NOTES.BY_ID(noteId), method: "DELETE" }),
        }),
    }),
});

export const {
    useGetNotesQuery,
    useLazyGetNotesQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = notesApi;
