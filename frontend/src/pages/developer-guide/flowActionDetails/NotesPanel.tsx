import { FC, useState, useCallback, useEffect } from "react";

const STORAGE_PREFIX = "developer-guide-notes";

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export type NotesByPath = Record<string, Note[]>;

function getStorageKey(actionApi: string, useCaseId?: string): string {
    return `${STORAGE_PREFIX}-${actionApi}-${useCaseId ?? "default"}`;
}

function loadNotesByPath(actionApi: string, useCaseId?: string): NotesByPath {
    try {
        const raw = localStorage.getItem(getStorageKey(actionApi, useCaseId));
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object") return {};
        return parsed as NotesByPath;
    } catch {
        return {};
    }
}

function saveNotesByPath(
    actionApi: string,
    useCaseId: string | undefined,
    byPath: NotesByPath
): void {
    try {
        localStorage.setItem(getStorageKey(actionApi, useCaseId), JSON.stringify(byPath));
    } catch {
        // ignore
    }
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDateTime(ts: number): string {
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
    const timeStr = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
}

interface NotesPanelProps {
    selectedPath: string | null;
    actionApi: string;
    useCaseId?: string;
}

const NotesPanel: FC<NotesPanelProps> = ({ selectedPath, actionApi, useCaseId }) => {
    const [notesByPath, setNotesByPath] = useState<NotesByPath>(() =>
        loadNotesByPath(actionApi, useCaseId)
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");

    const pathKey = selectedPath ?? "$";
    const notes = notesByPath[pathKey] ?? [];

    useEffect(() => {
        setNotesByPath(loadNotesByPath(actionApi, useCaseId));
    }, [actionApi, useCaseId]);

    const persist = useCallback(
        (path: string, nextNotesForPath: Note[]) => {
            setNotesByPath((prev) => {
                const next = { ...prev };
                if (nextNotesForPath.length === 0) delete next[path];
                else next[path] = nextNotesForPath;
                saveNotesByPath(actionApi, useCaseId, next);
                return next;
            });
        },
        [actionApi, useCaseId]
    );

    const startCreate = useCallback(() => {
        setFormTitle("");
        setFormContent("");
        setEditingId(null);
        setIsCreating(true);
    }, []);

    const cancelForm = useCallback(() => {
        setIsCreating(false);
        setEditingId(null);
        setFormTitle("");
        setFormContent("");
    }, []);

    const saveNote = useCallback(() => {
        const path = pathKey;
        const title = formTitle.trim() || "Untitled note";
        const content = formContent.trim();
        const now = Date.now();
        if (editingId) {
            persist(
                path,
                notes.map((n) =>
                    n.id === editingId ? { ...n, title, content, updatedAt: now } : n
                )
            );
            setEditingId(null);
        } else if (isCreating) {
            persist(path, [
                { id: generateId(), title, content, createdAt: now, updatedAt: now },
                ...notes,
            ]);
            setIsCreating(false);
        }
        setFormTitle("");
        setFormContent("");
    }, [pathKey, formTitle, formContent, editingId, isCreating, notes, persist]);

    const editNote = useCallback((note: Note) => {
        setFormTitle(note.title);
        setFormContent(note.content);
        setEditingId(note.id);
        setIsCreating(false);
    }, []);

    const deleteNote = useCallback(
        (id: string) => {
            if (editingId === id) cancelForm();
            persist(
                pathKey,
                notes.filter((n) => n.id !== id)
            );
        },
        [pathKey, notes, editingId, cancelForm, persist]
    );

    const showForm = isCreating || editingId !== null;
    const hasPath = selectedPath != null;

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Path + New note */}
            {hasPath && (
                <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 font-mono text-xs">
                        {selectedPath}
                    </span>
                    <button
                        type="button"
                        onClick={startCreate}
                        disabled={showForm}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New note
                    </button>
                </div>
            )}

            {/* Add / Edit form — floating card */}
            {hasPath && showForm && (
                <div className="shrink-0 mb-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-3 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 bg-slate-50/80 rounded-xl border-0 focus:ring-2 focus:ring-amber-500/20 focus:bg-white mb-2 transition-colors"
                    />
                    <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Write your note..."
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/80 rounded-xl border-0 focus:ring-2 focus:ring-amber-500/20 focus:bg-white resize-none transition-colors"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={saveNote}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-sm transition-colors"
                        >
                            {editingId ? "Save" : "Add"}
                        </button>
                        <button
                            type="button"
                            onClick={cancelForm}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto min-h-0">
                {!hasPath && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <svg
                                className="w-6 h-6 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-500">
                            Select a key in the JSON tree to add notes.
                        </p>
                    </div>
                )}

                {hasPath && notes.length === 0 && !showForm && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm text-slate-400">No notes for this path yet.</p>
                    </div>
                )}

                {hasPath && (notes.length > 0 || showForm) && (
                    <div className="space-y-3">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className={`p-4 rounded-2xl border shadow-sm transition-all ${
                                    editingId === note.id
                                        ? "bg-amber-50/50 border-amber-200/80"
                                        : "bg-white border-slate-200/80 hover:shadow-md"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-slate-800 truncate">
                                            {note.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {formatDateTime(note.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-70 hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={() => editNote(note)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                                            title="Edit"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteNote(note.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                            title="Delete"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {editingId !== note.id && (
                                    <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap line-clamp-3">
                                        {note.content || "No content"}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesPanel;
