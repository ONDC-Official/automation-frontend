export type OpenAIRole = "system" | "user" | "assistant" | "tool";

export interface OpenAIMessage {
    role: OpenAIRole;
    content?: string | null;
    name?: string;
    tool_call_id?: string;
    tool_calls?: OpenAIToolCall[];
}

export interface OpenAIToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

export interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export interface ChatCompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    tools?: OpenAITool[];
    tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
    temperature?: number;
    max_tokens?: number;
    stop?: string[];
    stream?: boolean;
}

export interface ChatCompletionResponse {
    id: string;
    choices: {
        index: number;
        message: OpenAIMessage;
        finish_reason: string | null;
    }[];
}

export type StreamEvent =
    | { type: "content"; delta: string }
    | {
          type: "tool_call_delta";
          index: number;
          id?: string;
          name?: string;
          argumentsDelta?: string;
      }
    | { type: "finish_reason"; reason: string }
    | { type: "error"; message: string };
