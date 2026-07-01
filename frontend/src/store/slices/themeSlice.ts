import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemePreference } from "@/context/theme/themeContextTypes";

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
    },
});

export const { setPreference } = themeSlice.actions;
export default themeSlice;
