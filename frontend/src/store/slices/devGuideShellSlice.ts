import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IDevGuideShellState {
    navSidebarOpen: boolean;
}

const initialState: IDevGuideShellState = {
    navSidebarOpen: true,
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
        resetDevGuideShell: () => initialState,
    },
});

export const { setNavSidebarOpen, toggleNavSidebar, resetDevGuideShell } =
    devGuideShellSlice.actions;

export default devGuideShellSlice;
