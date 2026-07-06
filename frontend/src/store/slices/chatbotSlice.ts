import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IChatbotState {
    mcpSessionId: string | null;
}

const initialState: IChatbotState = {
    mcpSessionId: null,
};

const chatbotSlice = createSlice({
    name: "chatbot",
    initialState,
    reducers: {
        setMcpSessionId: (state, action: PayloadAction<string | null>) => {
            state.mcpSessionId = action.payload;
        },
    },
});

export const { setMcpSessionId } = chatbotSlice.actions;

export const selectMcpSessionId = (state: { chatbot: IChatbotState }) => state.chatbot.mcpSessionId;

export default chatbotSlice;
