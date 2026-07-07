import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemePreference, ResolvedTheme } from "@/theme/types";
import { resolveTheme } from "@/theme/utils/themeUtils";

export interface IThemeState {
    preference: ThemePreference;
}

const initialState: IThemeState = {
    preference: "light",
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setPreference: (state, action: PayloadAction<ThemePreference>) => {
            state.preference = action.payload;
        },
        setTheme: (state, action: PayloadAction<ResolvedTheme>) => {
            state.preference = action.payload;
        },
        toggleTheme: (state) => {
            const resolved = resolveTheme(state.preference);
            state.preference = resolved === "dark" ? "light" : "dark";
        },
    },
});

export const { setPreference, setTheme, toggleTheme } = themeSlice.actions;

export const selectThemePreference = (state: { theme: IThemeState }) => state.theme.preference;
export const selectResolvedTheme = (state: { theme: IThemeState }) =>
    resolveTheme(state.theme.preference);
export const selectIsDark = (state: { theme: IThemeState }) =>
    resolveTheme(state.theme.preference) === "dark";

export default themeSlice;
