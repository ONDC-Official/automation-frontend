import { type FC, useState, useCallback, useContext } from "react";
import * as notesApi from "@services/developerGuideNotesApi";
import { AuthContext } from "@/context/authContext";
import GuideAsyncPanel from "../../shared/components/GuideAsyncPanel";
import GuidePanel from "../../shared/components/GuidePanel";
import { EmptyState } from "../../shared/components/states";
import { useThreadedApi } from "../../shared/hooks/useThreadedApi";
import { IconAdd, IconNote } from "../../shared/icons";
import NoteForm from "./NoteForm";
import NoteCard from "./NoteCard";
import { apiNoteToNote, generateNoteId, groupNotesByPath } from "./utils";
import type { Note, NotesPanelProps } from "./types";

const NotesPanel: FC<NotesPanelProps> = ({ selectedPath, actionApi, useCaseId, flowId }) => {
    const { user } = useContext(AuthContext);
    const isLoggedIn = Boolean(user);
    const useApi = Boolean(flowId && useCaseId);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");

    const {
        items: notes,
        setItems: setNotes,
        loading,
        error,
        mutate,
    } = useThreadedApi<Note>({
        enabled: useApi,
        fetchItems: async () => {
            const res = await notesApi.getNotes({
                use_case_id: useCaseId!,
                flow_id: flowId!,
                action_id: actionApi,
            });
            const list = Array.isArray(res.data) ? res.data : [];
            return list.map(apiNoteToNote);
        },
        deps: [flowId, useCaseId, actionApi],
    });

    const showForm = isCreating || editingId !== null;
    const hasPath = selectedPath != null;
    const pathKey = selectedPath ?? "$";
    const notesByPath = groupNotesByPath(notes);
    const selectPathEmptyState = (
        <EmptyState message="Select a key in the JSON tree to add notes." icon={IconNote} />
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

    const saveNote = useCallback(async () => {
        const isCreate = !editingId;
        if (isCreate && !isLoggedIn) return;
        const path = pathKey;
        const title = formTitle.trim() || "Untitled note";
        const content = formContent.trim();
        const noteText = title && content ? `${title}\n${content}` : content || title;
        const now = Date.now();

        if (useApi && flowId && useCaseId) {
            const ok = await mutate(async () => {
                if (editingId) {
                    await notesApi.updateNote(editingId, { note: noteText });
                } else {
                    await notesApi.createNote({
                        use_case_id: useCaseId,
                        flow_id: flowId,
                        action_id: actionApi,
                        json_path: path,
                        note: noteText,
                    });
                }
            }, "Failed to save note");
            if (!ok) return;
            setEditingId(null);
            setIsCreating(false);
        } else {
            if (editingId) {
                setNotes((prev) =>
                    prev.map((n) =>
                        n.id === editingId ? { ...n, title, content, updatedAt: now } : n
                    )
                );
                setEditingId(null);
            } else if (isCreating) {
                setNotes((prev) => [
                    { id: generateNoteId(), path, title, content, createdAt: now, updatedAt: now },
                    ...prev,
                ]);
                setIsCreating(false);
            }
        }
        setFormTitle("");
        setFormContent("");
    }, [
        isLoggedIn,
        pathKey,
        formTitle,
        formContent,
        editingId,
        isCreating,
        useApi,
        flowId,
        useCaseId,
        actionApi,
        mutate,
        setNotes,
    ]);

    const editNote = useCallback((note: Note) => {
        const lines = note.content.split("\n");
        const title = lines[0]?.trim() ?? "";
        const content = lines.slice(1).join("\n").trim();
        setFormTitle(title);
        setFormContent(content);
        setEditingId(note.id);
        setIsCreating(false);
    }, []);

    const deleteNote = useCallback(
        async (id: string) => {
            if (editingId === id) cancelForm();
            if (useApi && flowId && useCaseId) {
                await mutate(() => notesApi.deleteNote(id), "Failed to delete note");
            } else {
                setNotes((prev) => prev.filter((n) => n.id !== id));
            }
        },
        [editingId, cancelForm, useApi, flowId, useCaseId, mutate, setNotes]
    );

    if (!isLoggedIn) {
        return (
            <GuidePanel title="Notes">
                <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-slate-500">Please login to view notes.</p>
                </div>
            </GuidePanel>
        );
    }

    return (
        <GuideAsyncPanel title="Notes" loading={loading} error={error}>
            <>
                {hasPath && (
                    <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 font-mono text-xs break-all min-w-0">
                            {selectedPath}
                        </span>
                        {isLoggedIn ? (
                            <button
                                type="button"
                                onClick={startCreate}
                                disabled={showForm}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 disabled:opacity-50 transition-colors shrink-0"
                            >
                                <IconAdd className="w-4 h-4" />
                                New note
                            </button>
                        ) : (
                            <span className="text-sm text-slate-500 shrink-0">
                                Sign in to add notes.
                            </span>
                        )}
                    </div>
                )}

                {showForm && (isLoggedIn || editingId !== null) && (
                    <NoteForm
                        title={formTitle}
                        content={formContent}
                        isEditing={editingId !== null}
                        onTitleChange={setFormTitle}
                        onContentChange={setFormContent}
                        onSave={saveNote}
                        onCancel={cancelForm}
                    />
                )}

                <div className="flex-1 overflow-auto min-h-0">
                    {!hasPath && notes.length === 0 && !showForm && selectPathEmptyState}

                    {hasPath && notes.length === 0 && !showForm && (
                        <EmptyState variant="text" message="No notes on this path yet." />
                    )}

                    {(notes.length > 0 || showForm) && (
                        <div className="space-y-3">
                            {hasPath && (
                                <div className="shrink-0 mb-4">
                                    <p className="text-sm text-slate-700 mb-2 break-all">
                                        Notes on{" "}
                                        <span className="text-amber-700 dark:text-amber-300 font-medium text-sm">
                                            {selectedPath}
                                        </span>
                                    </p>
                                    {(notesByPath[pathKey] ?? []).length === 0 ? (
                                        <p className="text-sm text-slate-400 py-2">
                                            No notes on this key yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(notesByPath[pathKey] ?? []).map(
                                                (note) =>
                                                    editingId !== note.id && (
                                                        <NoteCard
                                                            key={note.id}
                                                            note={note}
                                                            onEdit={editNote}
                                                            onDelete={deleteNote}
                                                        />
                                                    )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {notes.length > 0 && (
                                <p className="text-sm text-slate-700 mb-3">All Notes</p>
                            )}
                            {notes.map(
                                (note) =>
                                    editingId !== note.id && (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            onEdit={editNote}
                                            onDelete={deleteNote}
                                        />
                                    )
                            )}
                            {!hasPath && selectPathEmptyState}
                        </div>
                    )}
                </div>
            </>
        </GuideAsyncPanel>
    );
};

export default NotesPanel;
