import { createContext, type Dispatch, type SetStateAction } from "react";
import type { IProfileCounts } from "@pages/user-profile/types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectProfileCounts, setCounts as setCountsAction } from "@store/slices/profileShellSlice";
import { createDispatchSetter } from "@store/utils/createDispatchSetter";

export interface IProfileShellContext {
    counts: IProfileCounts;
    setCounts: Dispatch<SetStateAction<IProfileCounts>>;
}

// Retained for backward compatibility; the source of truth is the Redux `profileShell` slice.
export const ProfileShellContext = createContext<IProfileShellContext | null>(null);

/**
 * Reads profile sidebar counts from the Redux `profileShell` slice. Works anywhere (no provider
 * required) — matches the previous standalone-safe behavior.
 */
export const useProfileShell = (): IProfileShellContext => {
    const dispatch = useAppDispatch();
    const counts = useAppSelector(selectProfileCounts);
    const setCounts = createDispatchSetter(counts, (next) => dispatch(setCountsAction(next)));
    return { counts, setCounts };
};
