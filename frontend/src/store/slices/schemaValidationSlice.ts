import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ISchemaValidationState {
    draftPayload: string;
}

const initialState: ISchemaValidationState = {
    draftPayload: "",
};

const schemaValidationSlice = createSlice({
    name: "schemaValidation",
    initialState,
    reducers: {
        setDraftPayload: (state, action: PayloadAction<string>) => {
            state.draftPayload = action.payload;
        },
    },
});

export const { setDraftPayload } = schemaValidationSlice.actions;

export const selectSchemaDraftPayload = (state: { schemaValidation: ISchemaValidationState }) =>
    state.schemaValidation.draftPayload;

export default schemaValidationSlice;
