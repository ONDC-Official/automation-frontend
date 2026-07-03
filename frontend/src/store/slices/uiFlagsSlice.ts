import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IUiFlagsState {
    /** Keyed by `${flowId}:${txnId}` — marks that a LAMF launch popup has already been handled. */
    lamfLaunchDone: Record<string, boolean>;
    /** External redirect popup flags (formerly `finvu_flow_active` / `dynamic_form_flow_active`). */
    finvuFlowActive: boolean;
    dynamicFormFlowActive: boolean;
}

const initialState: IUiFlagsState = {
    lamfLaunchDone: {},
    finvuFlowActive: false,
    dynamicFormFlowActive: false,
};

const uiFlagsSlice = createSlice({
    name: "uiFlags",
    initialState,
    reducers: {
        setLamfLaunchDone: (state, action: PayloadAction<string>) => {
            state.lamfLaunchDone[action.payload] = true;
        },
        clearLamfLaunchDone: (state, action: PayloadAction<string>) => {
            delete state.lamfLaunchDone[action.payload];
        },
        setFinvuFlowActive: (state, action: PayloadAction<boolean>) => {
            state.finvuFlowActive = action.payload;
        },
        setDynamicFormFlowActive: (state, action: PayloadAction<boolean>) => {
            state.dynamicFormFlowActive = action.payload;
        },
    },
});

export const {
    setLamfLaunchDone,
    clearLamfLaunchDone,
    setFinvuFlowActive,
    setDynamicFormFlowActive,
} = uiFlagsSlice.actions;

export const selectLamfLaunchDone = (key: string) => (state: { uiFlags: IUiFlagsState }) =>
    Boolean(state.uiFlags.lamfLaunchDone[key]);

export default uiFlagsSlice;
