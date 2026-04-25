import { parseSSEStream } from "./streaming";
import type { ChatCompletionRequest, ChatCompletionResponse, StreamEvent } from "./types";

export interface OpenAIClient {
    chatCompletions: (
        req: ChatCompletionRequest,
        signal?: AbortSignal
    ) => Promise<ChatCompletionResponse>;
    chatCompletionsStream: (
        req: ChatCompletionRequest,
        signal?: AbortSignal
    ) => AsyncGenerator<StreamEvent, void, void>;
}

export interface OpenAIClientOptions {
    endpoint: string;
    apiKey: string;
    /** When true, requests are routed through the ONDC backend proxy to avoid CORS errors. */
    useProxy?: boolean;
}

function buildUrl(endpoint: string): string {
    const trimmed = endpoint.replace(/\/$/, "");
    // Accept either a bare base URL ("https://api.openai.com") or one already
    // containing the /v1 suffix so users can point to proxies like Azure.
    if (/\/v\d+$/.test(trimmed)) {
        return `${trimmed}/chat/completions`;
    }
    return `${trimmed}/v1/chat/completions`;
}

export function createOpenAIClient({
    endpoint,
    apiKey,
    useProxy = false,
}: OpenAIClientOptions): OpenAIClient {
    // Deliberately uses native fetch — not the app's axios client — so the
    // ONDC backend Bearer token interceptor in @services/apiClient cannot leak
    // to the LLM endpoint.
    const llmUrl = buildUrl(endpoint);

    // When useProxy is enabled, requests are forwarded through the ONDC backend
    // which adds CORS-safe origin for external LLM providers. The API key is
    // passed via Authorization and x-proxy-target tells the proxy where to send it.
    const backendBase = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "";
    const proxyUrl = `${backendBase}/ai/proxy`;

    const fetchUrl = useProxy ? proxyUrl : llmUrl;
    const extraHeaders: Record<string, string> = useProxy ? { "x-proxy-target": llmUrl } : {};

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
    };

    async function chatCompletions(
        req: ChatCompletionRequest,
        signal?: AbortSignal
    ): Promise<ChatCompletionResponse> {
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ ...req, stream: false }),
            signal,
        });
        if (!response.ok) {
            throw new Error(`AI request failed: HTTP ${response.status}`);
        }
        return (await response.json()) as ChatCompletionResponse;
    }

    async function* chatCompletionsStream(
        req: ChatCompletionRequest,
        signal?: AbortSignal
    ): AsyncGenerator<StreamEvent, void, void> {
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ ...req, stream: true }),
            signal,
        });
        if (!response.ok) {
            throw new Error(`AI stream request failed: HTTP ${response.status}`);
        }
        yield* parseSSEStream(response, signal);
    }

    return { chatCompletions, chatCompletionsStream };
}
