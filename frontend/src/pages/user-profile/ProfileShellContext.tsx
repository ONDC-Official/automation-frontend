import { createContext, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import type { IProfileCounts } from "@pages/user-profile/types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectProfileCounts, setCounts as setCountsAction } from "@store/slices/profileShellSlice";

export interface IProfileShellContext {
    counts: IProfileCounts;
    setCounts: Dispatch<SetStateAction<IProfileCounts>>;
}

// Retained for backward compatibility; the source of truth is the Redux `profileShell` slice.
export const ProfileShellContext = createContext<IProfileShellContext | null>(null);

/**
 * Reads profile sidebar counts from the Redux `profileShell` slice. Works anywhere (no provider
 * required) — matches the previous standalone-safe behavior.
 *
 * `setCounts` must keep a stable identity across renders: callers put it in `useEffect` dependency
 * arrays (matching how a real `useState` setter is used), and `counts` itself changes reference on
 * every dispatch. A plain `createDispatchSetter(counts, ...)` call here would hand back a new
 * function every render, which — combined with a caller's `[..., setCounts]` effect deps — becomes
 * an infinite render loop (dispatch -> new counts -> new setCounts -> effect refires -> dispatch...).
 * The ref holds the latest `counts` for the functional-update form without that identity churn.
 */
export const useProfileShell = (): IProfileShellContext => {
    const dispatch = useAppDispatch();
    const counts = useAppSelector(selectProfileCounts);
    const countsRef = useRef(counts);
    countsRef.current = counts;
    const setCounts = useCallback<Dispatch<SetStateAction<IProfileCounts>>>(
        (value) => {
            const next =
                typeof value === "function"
                    ? (value as (prev: IProfileCounts) => IProfileCounts)(countsRef.current)
                    : value;
            dispatch(setCountsAction(next));
        },
        [dispatch]
    );
    return { counts, setCounts };
};
