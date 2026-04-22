import type { StreamEvent } from "./types";

interface StreamingChoiceDelta {
    content?: string;
    tool_calls?: Array<{
        index: number;
        id?: string;
        type?: "function";
        function?: {
            name?: string;
            arguments?: string;
        };
    }>;
}

interface StreamingChunk {
    choices?: Array<{
        index: number;
        delta?: StreamingChoiceDelta;
        finish_reason?: string | null;
    }>;
}

export async function* parseSSEStream(
    response: Response,
    signal?: AbortSignal
): AsyncGenerator<StreamEvent, void, void> {
    if (!response.body) {
        yield { type: "error", message: "Response has no body" };
        return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            if (signal?.aborted) return;
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split("\n\n");
            buffer = frames.pop() ?? "";
            for (const frame of frames) {
                for (const line of frame.split("\n")) {
                    if (!line.startsWith("data: ")) continue;
                    const payload = line.slice(6).trim();
                    if (!payload) continue;
                    if (payload === "[DONE]") return;
                    let chunk: StreamingChunk;
                    try {
                        chunk = JSON.parse(payload) as StreamingChunk;
                    } catch {
                        continue;
                    }
                    const choice = chunk.choices?.[0];
                    if (!choice) continue;
                    const delta = choice.delta;
                    if (delta?.content) {
                        yield { type: "content", delta: delta.content };
                    }
                    if (delta?.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            yield {
                                type: "tool_call_delta",
                                index: tc.index,
                                id: tc.id,
                                name: tc.function?.name,
                                argumentsDelta: tc.function?.arguments,
                            };
                        }
                    }
                    if (choice.finish_reason) {
                        yield { type: "finish_reason", reason: choice.finish_reason };
                    }
                }
            }
        }
    } finally {
        try {
            reader.releaseLock();
        } catch {
            // reader may already be released on abort; ignore.
        }
    }
}
