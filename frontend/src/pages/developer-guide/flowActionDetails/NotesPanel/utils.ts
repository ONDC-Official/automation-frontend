import type { NoteResponse } from "@services/developerGuideNotesApi";
import { generateLocalId } from "../../shared/utils/generateLocalId";
import type { Note, NotesByPath } from "./types";

export function apiNoteToNote(r: NoteResponse): Note {
    const content = r.note ?? "";
    const firstLine = content.split("\n")[0]?.trim() || "";
    const title = firstLine.slice(0, 80) || "Untitled note";
    return {
        id: r._id,
        path: r.json_path ?? "$",
        title,
        content,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
    };
}

export function groupNotesByPath(notes: Note[]): NotesByPath {
    const byPath: NotesByPath = {};
    for (const note of notes) {
        if (!byPath[note.path]) byPath[note.path] = [];
        byPath[note.path].push(note);
    }
    return byPath;
}

export const generateNoteId = generateLocalId;
