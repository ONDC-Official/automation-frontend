import { parseSSEStream } from "./streaming";
import type { ChatCompletionRequest, ChatCompletionResponse, StreamEvent } from "./types";

// Bound the time we wait for the LLM (or proxy) to send response headers.
// Without this, DNS/TLS/proxy stalls hang fetch() until the OS gives up.
// Once headers arrive, the per-frame STREAM_IDLE_TIMEOUT_MS in streaming.ts
// takes over — we don't want a long but healthy generation to abort here.
const FETCH_HEADERS_TIMEOUT_MS = 30_000;

async function fetchWithHeadersTimeout(
    url: string,
    init: RequestInit,
    userSignal: AbortSignal | undefined,
    timeoutMs: number
): Promise<Response> {
    const ctrl = new AbortController();
    if (userSignal?.aborted) {
        ctrl.abort(userSignal.reason);
    } else if (userSignal) {
        // Listener intentionally not removed: it must stay active for the
        // streaming body so user Stop still aborts mid-response.
        userSignal.addEventListener("abort", () => ctrl.abort(userSignal.reason), {
            once: true,
        });
    }
    const timeoutId = setTimeout(
        () => ctrl.abort(new DOMException("Initial fetch timeout", "TimeoutError")),
        timeoutMs
    );
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

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
        const response = await fetchWithHeadersTimeout(
            fetchUrl,
            {
                method: "POST",
                headers,
                body: JSON.stringify({ ...req, stream: false }),
            },
            signal,
            FETCH_HEADERS_TIMEOUT_MS
        );
        if (!response.ok) {
            throw new Error(`AI request failed: HTTP ${response.status}`);
        }
        return (await response.json()) as ChatCompletionResponse;
    }

    async function* chatCompletionsStream(
        req: ChatCompletionRequest,
        signal?: AbortSignal
    ): AsyncGenerator<StreamEvent, void, void> {
        const response = await fetchWithHeadersTimeout(
            fetchUrl,
            {
                method: "POST",
                headers,
                body: JSON.stringify({ ...req, stream: true }),
            },
            signal,
            FETCH_HEADERS_TIMEOUT_MS
        );
        if (!response.ok) {
            throw new Error(`AI stream request failed: HTTP ${response.status}`);
        }
        yield* parseSSEStream(response, signal);
    }

    return { chatCompletions, chatCompletionsStream };
}
