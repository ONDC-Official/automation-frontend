/**
 * Notes API for developer guide (use_case_id, flow_id, action_id, json_path).
 * Uses developerGuideApiClient (developer guide backend).
 */
import { developerGuideNotesApiClient } from "./apiClient";
import { API_ROUTES } from "./apiRoutes";
import type { ApiResponse } from "./apiClient";

export interface NotePayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    note: string;
}

export interface NoteResponse {
    _id: string;
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
}

export async function getNotes(params: {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
}): Promise<ApiResponse<NoteResponse[]>> {
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    const query = search.toString();
    const url = query ? `${API_ROUTES.NOTES.BASE}?${query}` : API_ROUTES.NOTES.BASE;
    return developerGuideNotesApiClient.get<NoteResponse[]>(url, {});
}

export async function createNote(payload: NotePayload): Promise<ApiResponse<NoteResponse>> {
    return developerGuideNotesApiClient.post<NoteResponse>(API_ROUTES.NOTES.BASE, payload, {});
}

export async function updateNote(
    noteId: string,
    payload: NotePayload
): Promise<ApiResponse<NoteResponse>> {
    return developerGuideNotesApiClient.put<NoteResponse>(
        API_ROUTES.NOTES.BY_ID(noteId),
        payload,
        {}
    );
}

export async function deleteNote(noteId: string): Promise<ApiResponse<unknown>> {
    return developerGuideNotesApiClient.delete(API_ROUTES.NOTES.BY_ID(noteId), {});
}
