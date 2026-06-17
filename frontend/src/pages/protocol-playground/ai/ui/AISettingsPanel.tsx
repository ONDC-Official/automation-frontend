import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Switch } from "@/components/Shadcn/Switch/switch";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL } from "../constants";
import { AIContext } from "../context/ai-context";
import { getKey } from "@utils/secure-key-store";

interface IAISettingsPanelProps {
    onClose?: () => void;
}

export const AISettingsPanel = ({ onClose }: IAISettingsPanelProps) => {
    const ai = useContext(AIContext);
    const [endpoint, setEndpoint] = useState(ai.settings.endpoint);
    const [model, setModel] = useState(ai.settings.model);
    const [inlineEnabled, setInlineEnabled] = useState(ai.settings.inlineCompletionEnabled);
    const [useProxy, setUseProxy] = useState(ai.settings.useProxy);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [modelsFetching, setModelsFetching] = useState(false);

    const buildModelsUrl = (ep: string): string => {
        const trimmed = ep.replace(/\/$/, "");
        if (/\/v\d+$/.test(trimmed)) return `${trimmed}/models`;
        return `${trimmed}/v1/models`;
    };

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
            <h3 className="text-base font-semibold text-text-primary">AI settings</h3>

            <div className="flex flex-col gap-1 text-sm text-text-secondary">
                <label htmlFor="ai-endpoint" className="font-medium">
                    Endpoint
                </label>
                <Input
                    id="ai-endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder={DEFAULT_AI_ENDPOINT}
                />
                <span className="text-xs text-text-tertiary">
                    OpenAI-compatible base URL.{" "}
                    {useProxy
                        ? "Requests are routed through the ONDC backend proxy — your key is forwarded in-flight only, never stored."
                        : "Requests go directly from your browser to this endpoint."}
                </span>
            </div>

            <div className="flex flex-col gap-1 text-sm text-text-secondary">
                <label htmlFor="ai-model" className="font-medium">
                    Model
                </label>
                <div className="flex gap-2 items-center">
                    {availableModels.length > 0 ? (
                        <Combobox
                            items={availableModels}
                            value={model || null}
                            onValueChange={(value) => setModel(value ?? "")}
                        >
                            <ComboboxInput
                                id="ai-model"
                                placeholder="Select a model..."
                                className="flex-1"
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>No models found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    ) : (
                        <Input
                            id="ai-model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder={DEFAULT_AI_MODEL}
                            className="flex-1"
                        />
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title="Fetch available models from endpoint"
                        onClick={fetchModels}
                        disabled={modelsFetching}
                        isLoading={modelsFetching}
                        className="shrink-0"
                    >
                        {!modelsFetching && <ArrowPathIcon className="size-3.5" />}
                        {modelsFetching ? "Fetching…" : "Fetch"}
                    </Button>
                </div>
                <span className="text-xs text-text-tertiary">
                    Click Fetch to load available models from your endpoint, or type a model name
                    manually.
                </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
                <label htmlFor="ai-inline" className="cursor-pointer font-medium">
                    Enable inline autocomplete in JS editors
                </label>
                <Switch
                    id="ai-inline"
                    checked={inlineEnabled}
                    onCheckedChange={setInlineEnabled}
                />
            </div>

            <div className="flex items-start justify-between gap-3 text-sm text-text-secondary">
                <div className="flex flex-col gap-0.5">
                    <label htmlFor="ai-proxy" className="cursor-pointer font-medium">
                        Route requests through backend proxy
                    </label>
                    <span className="text-xs text-text-tertiary">
                        Fixes CORS errors for external endpoints (e.g. api.ollama.com). Your API key
                        is forwarded as a header and never logged or stored by the proxy.
                    </span>
                </div>
                <Switch id="ai-proxy" checked={useProxy} onCheckedChange={setUseProxy} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default">
                <Button type="button" size="sm" onClick={save}>
                    Save settings
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLock}
                    disabled={!ai.isUnlocked}
                >
                    Lock now
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearKey}
                    disabled={!ai.isConfigured}
                    className="border-error-500/40 text-error-500 hover:bg-error-50"
                >
                    Clear key
                </Button>
            </div>
        </div>
    );
};
