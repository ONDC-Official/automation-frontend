import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { IProfileCounts } from "@pages/user-profile/types";

export interface IProfileShellContext {
    counts: IProfileCounts;
    setCounts: Dispatch<SetStateAction<IProfileCounts>>;
}

export const ProfileShellContext = createContext<IProfileShellContext | null>(null);

const NOOP_SET_COUNTS: Dispatch<SetStateAction<IProfileCounts>> = () => {};

const STANDALONE_SHELL: IProfileShellContext = {
    counts: { configs: 0, pastReports: 0, history: 0 },
    setCounts: NOOP_SET_COUNTS,
};

export const useProfileShell = () => useContext(ProfileShellContext) ?? STANDALONE_SHELL;
