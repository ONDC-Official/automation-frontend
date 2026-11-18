import { useCallback, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    clearStudioDraft,
    saveStudioDraft,
    selectStudioDraft,
    type StudioDraft,
} from "@store/slices/studioDraftSlice";

export type { StudioDraft } from "@store/slices/studioDraftSlice";
export { STUDIO_DRAFT_VERSION } from "@store/slices/studioDraftSlice";

/**
 * The local draft as Studio uses it: what is saved (null when nothing is, or
 * it was written with another schema version), and how to write or drop it.
 * Backed by the persisted `studioDraft` slice — see its header for why a
 * single draft, and what comes later.
 */
export const useStudioDraft = () => {
    const dispatch = useAppDispatch();
    const draft = useAppSelector(selectStudioDraft);
    const save = useCallback(
        (next: Omit<StudioDraft, "version" | "savedAt">) => dispatch(saveStudioDraft(next)),
        [dispatch]
    );
    const clear = useCallback(() => dispatch(clearStudioDraft()), [dispatch]);
    return useMemo(() => ({ draft, save, clear }), [draft, save, clear]);
};
