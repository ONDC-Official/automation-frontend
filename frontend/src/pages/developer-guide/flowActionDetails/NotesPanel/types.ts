export interface Note {
    id: string;
    path: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export type NotesByPath = Record<string, Note[]>;

export interface NotesPanelProps {
    selectedPath: string | null;
    actionApi: string;
    useCaseId?: string;
    flowId?: string;
}
