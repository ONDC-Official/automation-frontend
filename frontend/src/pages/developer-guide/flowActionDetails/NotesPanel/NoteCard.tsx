import { type FC } from "react";
import { IconEdit, IconDelete } from "../../shared/icons";
import { formatDateTime } from "../../shared/utils/formatDateTime";
import type { Note } from "./types";

interface NoteCardProps {
    note: Note;
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
}

const NoteCard: FC<NoteCardProps> = ({ note, onEdit, onDelete }) => (
    <div className="p-4 rounded-2xl border shadow-xs bg-white dark:bg-surface-elevated border-slate-200/80 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                <h4 className="font-medium text-slate-800 truncate">{note.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(note.updatedAt)}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-70 hover:opacity-100">
                <button
                    type="button"
                    onClick={() => onEdit(note)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                    title="Edit"
                >
                    <IconEdit className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                >
                    <IconDelete className="w-4 h-4" />
                </button>
            </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap line-clamp-3">
            {note.content.split("\n").slice(1).join("\n").trim() || "No content"}
        </p>
    </div>
);

export default NoteCard;
