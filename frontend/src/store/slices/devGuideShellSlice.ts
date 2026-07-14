import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IDevGuideShellState {
    navSidebarOpen: boolean;
    commentsPanelOpen: boolean;
}

const initialState: IDevGuideShellState = {
    navSidebarOpen: true,
    commentsPanelOpen: true,
};

const devGuideShellSlice = createSlice({
    name: "devGuideShell",
    initialState,
    reducers: {
        setNavSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.navSidebarOpen = action.payload;
        },
        toggleNavSidebar: (state) => {
            state.navSidebarOpen = !state.navSidebarOpen;
        },
        setCommentsPanelOpen: (state, action: PayloadAction<boolean>) => {
            state.commentsPanelOpen = action.payload;
        },
        resetDevGuideShell: () => initialState,
    },
});

export const { setNavSidebarOpen, toggleNavSidebar, setCommentsPanelOpen, resetDevGuideShell } =
    devGuideShellSlice.actions;

export default devGuideShellSlice;
