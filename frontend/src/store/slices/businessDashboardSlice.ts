import { createSlice } from "@reduxjs/toolkit";

/**
 * The business dashboard's shared-password gate.
 *
 * The session itself is an httpOnly cookie owned by the backend's `/dashboard`
 * router — the browser cannot read it. This holds only the boolean the shell
 * gates on, so a reload doesn't flash the password card at someone who is
 * already signed in before `GET /dashboard/auth/me` answers.
 *
 * No token is stored here; there is none to store. Persisted to localStorage
 * rather than sessionStorage (which `frameworkHealth` uses) because the cookie
 * backing it is shared across tabs, and a per-tab flag would show the password
 * card in a second tab that is in fact already authenticated.
 */
export interface IBusinessDashboardState {
    isAuthenticated: boolean;
}

const initialState: IBusinessDashboardState = {
    isAuthenticated: false,
};

const businessDashboardSlice = createSlice({
    name: "businessDashboard",
    initialState,
    reducers: {
        signedIn: (state) => {
            state.isAuthenticated = true;
        },
        signedOut: (state) => {
            state.isAuthenticated = false;
        },
    },
});

export const { signedIn, signedOut } = businessDashboardSlice.actions;

export const selectDashboardAuthenticated = (state: {
    businessDashboard: IBusinessDashboardState;
}) => state.businessDashboard.isAuthenticated;

export default businessDashboardSlice;
