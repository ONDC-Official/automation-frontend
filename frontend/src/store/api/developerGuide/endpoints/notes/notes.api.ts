import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import type { INotePayload, INoteResponse, INotesListParams } from "./types";

// Notes/comments lists are scoped by the composite use_case_id+flow_id+action_id key, not by a
// single field — a flat "LIST" id would invalidate every action's notes on any one action's change.
const listId = (params: INotesListParams) =>
    `LIST-${params.use_case_id ?? ""}-${params.flow_id ?? ""}-${params.action_id ?? ""}`;

const buildNotesUrl = (params: INotesListParams) => {
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    const query = search.toString();
    return query ? `${API_ROUTES.NOTES.BASE}?${query}` : API_ROUTES.NOTES.BASE;
};

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
