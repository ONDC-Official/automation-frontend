import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { FiRefreshCw, FiChevronDown } from "react-icons/fi";

import { DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL } from "../constants";
import { AIContext } from "../context/ai-context";
import { getKey } from "@utils/secure-key-store";

interface AISettingsPanelProps {
    onClose?: () => void;
}

export function AISettingsPanel({ onClose }: AISettingsPanelProps) {
    const ai = useContext(AIContext);
    const [endpoint, setEndpoint] = useState(ai.settings.endpoint);
    const [model, setModel] = useState(ai.settings.model);
    const [inlineEnabled, setInlineEnabled] = useState(ai.settings.inlineCompletionEnabled);
    const [useProxy, setUseProxy] = useState(ai.settings.useProxy);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [modelsFetching, setModelsFetching] = useState(false);

    /** Build the /v1/models URL from the configured endpoint. */
    function buildModelsUrl(ep: string): string {
        const trimmed = ep.replace(/\/$/, "");
        if (/\/v\d+$/.test(trimmed)) return `${trimmed}/models`;
        return `${trimmed}/v1/models`;
    }

    const fetchModels = async () => {
        const ep = endpoint.trim() || DEFAULT_AI_ENDPOINT;
        const apiKey = getKey();
        const modelsUrl = buildModelsUrl(ep);

        const backendBase = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "";
        const fetchUrl = useProxy ? `${backendBase}/ai/proxy` : modelsUrl;
        const extraHeaders: Record<string, string> = useProxy
            ? { "x-proxy-target": modelsUrl }
            : {};

        setModelsFetching(true);
        try {
            const res = await fetch(fetchUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
                    ...extraHeaders,
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const ids: string[] = (data?.data ?? []).map((m: { id: string }) => m.id).sort();
            if (ids.length === 0) throw new Error("No models returned");
            setAvailableModels(ids);
            if (!ids.includes(model)) setModel(ids[0]);
        } catch (err) {
            toast.error(`Could not fetch models: ${err instanceof Error ? err.message : err}`);
        } finally {
            setModelsFetching(false);
        }
    };

    const save = () => {
        ai.updateSettings({
            endpoint: endpoint.trim() || DEFAULT_AI_ENDPOINT,
            model: model.trim() || DEFAULT_AI_MODEL,
            inlineCompletionEnabled: inlineEnabled,
            useProxy,
        });
        toast.success("AI settings saved.");
        onClose?.();
    };

    const handleClearKey = async () => {
        const confirmed = window.confirm(
            "This wipes the encrypted key from this browser. You will need to set up and re-enter your API key. Continue?"
        );
        if (!confirmed) return;
        await ai.clearKey();
        toast.info("AI key cleared.");
    };

    const handleLock = () => {
        ai.lock();
        toast.info("AI key locked for this session.");
    };

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-900">AI settings</h3>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
                Endpoint
                <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder={DEFAULT_AI_ENDPOINT}
                    className="border border-gray-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-xs text-gray-500">
                    OpenAI-compatible base URL.{" "}
                    {useProxy
                        ? "Requests are routed through the ONDC backend proxy — your key is forwarded in-flight only, never stored."
                        : "Requests go directly from your browser to this endpoint."}
                </span>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
                Model
                <div className="flex gap-2 items-center">
                    {availableModels.length > 0 ? (
                        <div className="relative flex-1">
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full appearance-none border border-gray-300 bg-white rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                {availableModels.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                    ) : (
                        <input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder={DEFAULT_AI_MODEL}
                            className="flex-1 border border-gray-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    )}
                    <button
                        type="button"
                        title="Fetch available models from endpoint"
                        onClick={fetchModels}
                        disabled={modelsFetching}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 shrink-0"
                    >
                        <FiRefreshCw
                            className={`w-3.5 h-3.5 ${modelsFetching ? "animate-spin" : ""}`}
                        />
                        {modelsFetching ? "Fetching…" : "Fetch"}
                    </button>
                </div>
                <span className="text-xs text-gray-500">
                    Click Fetch to load available models from your endpoint, or type a model name
                    manually.
                </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                    type="checkbox"
                    checked={inlineEnabled}
                    onChange={(e) => setInlineEnabled(e.target.checked)}
                />
                Enable inline autocomplete in JS editors
            </label>

            <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                />
                <span className="flex flex-col gap-0.5">
                    Route requests through backend proxy
                    <span className="text-xs text-gray-500 font-normal">
                        Fixes CORS errors for external endpoints (e.g. api.ollama.com). Your API key
                        is forwarded as a header and never logged or stored by the proxy.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                <button
                    type="button"
                    onClick={save}
                    className="px-3 py-1.5 text-sm rounded bg-sky-600 text-white hover:bg-sky-700"
                >
                    Save settings
                </button>
                <button
                    type="button"
                    onClick={handleLock}
                    disabled={!ai.isUnlocked}
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Lock now
                </button>
                <button
                    type="button"
                    onClick={handleClearKey}
                    disabled={!ai.isConfigured}
                    className="px-3 py-1.5 text-sm rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                    Clear key
                </button>
            </div>
        </div>
    );
}
