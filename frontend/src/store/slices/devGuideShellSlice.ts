import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BuildEntry, DocMeta, NavNode } from "@/types/apiShared/developerGuide";

export interface IDevGuideShellState {
    inShell: boolean;
    loadError: string | null;
    docs: DocMeta[];
    builds: BuildEntry[];
    navTree: NavNode[];
    navSidebarOpen: boolean;
}

const initialState: IDevGuideShellState = {
    inShell: false,
    loadError: null,
    docs: [],
    builds: [],
    navTree: [],
    navSidebarOpen: true,
};

const devGuideShellSlice = createSlice({
    name: "devGuideShell",
    initialState,
    reducers: {
        setDevGuideShellData: (
            state,
            action: PayloadAction<{
                inShell?: boolean;
                loadError?: string | null;
                docs?: DocMeta[];
                builds?: BuildEntry[];
                navTree?: NavNode[];
            }>
        ) => {
            return { ...state, ...action.payload };
        },
        setNavSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.navSidebarOpen = action.payload;
        },
        toggleNavSidebar: (state) => {
            state.navSidebarOpen = !state.navSidebarOpen;
        },
        resetDevGuideShell: () => initialState,
    },
});

export const { setDevGuideShellData, setNavSidebarOpen, toggleNavSidebar, resetDevGuideShell } =
    devGuideShellSlice.actions;

export default devGuideShellSlice;
