import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlayIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

import Popup from "@components/ui/pop-up/pop-up";
import { Button } from "@/components/Shadcn/Button/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import type { ToolMessage } from "../../hooks/use-chat-session";
import { usePendingApprovals } from "../../hooks/use-pending-approvals";
import { createReadToolRegistry } from "../../tools/registry";
import type { ToolContext } from "../../tools/types";
import { InspectorMessageList } from "./InspectorMessageList";
import type {
    IJsonSchemaParameters,
    IToolInspectorModalProps,
} from "@pages/protocol-playground/ai/ui/inspector/types";

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stubFromSchema(parameters: unknown): string {
    const params = parameters as IJsonSchemaParameters | undefined;
    const props = params?.properties;
    if (!props || typeof props !== "object") return "{}";
    const stub: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(props)) {
        if (prop.default !== undefined) {
            stub[key] = prop.default;
            continue;
        }
        if (Array.isArray(prop.enum) && prop.enum.length > 0) {
            stub[key] = prop.enum[0];
            continue;
        }
        const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
        switch (type) {
            case "string":
                stub[key] = "";
                break;
            case "number":
            case "integer":
                stub[key] = 0;
                break;
            case "boolean":
                stub[key] = false;
                break;
            case "array":
                stub[key] = [];
                break;
            case "object":
                stub[key] = {};
                break;
            default:
                stub[key] = null;
        }
    }
    return JSON.stringify(stub, null, 2);
}

export const ToolInspectorModal = ({ isOpen, onClose }: IToolInspectorModalProps) => {
    const playground = useContext(PlaygroundContext);
    const approvals = usePendingApprovals();
    const registry = useMemo(() => createReadToolRegistry(), []);
    const toolDefs = useMemo(() => registry.listDescriptions(), [registry]);

    const [selectedTool, setSelectedTool] = useState<string>(
        () => toolDefs[0]?.function.name ?? ""
    );
    const [argsJson, setArgsJson] = useState<string>("");
    const [messages, setMessages] = useState<ToolMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [showSchema, setShowSchema] = useState(false);

    const currentTool = useMemo(
        () => toolDefs.find((t) => t.function.name === selectedTool),
        [toolDefs, selectedTool]
    );

    // Reset stub args whenever the user picks a different tool.
    useEffect(() => {
        if (!currentTool) return;
        setArgsJson(stubFromSchema(currentTool.function.parameters));
    }, [currentTool]);

    const resetStub = () => {
        if (!currentTool) return;
        setArgsJson(stubFromSchema(currentTool.function.parameters));
    };

    const run = async () => {
        if (isRunning || !selectedTool) return;
        let parsed: unknown;
        try {
            parsed = argsJson.trim() === "" ? {} : JSON.parse(argsJson);
        } catch (err) {
            const m = err instanceof Error ? err.message : "invalid JSON";
            toast.error(`Invalid JSON args: ${m}`);
            return;
        }
        const toolCallId = makeId();
        const running: ToolMessage = {
            id: toolCallId,
            role: "tool",
            toolCallId,
            toolName: selectedTool,
            argsJson: JSON.stringify(parsed),
            status: "running",
        };
        setMessages((prev) => [...prev, running]);
        setIsRunning(true);

        const ctx: ToolContext = {
            config: playground.config,
            activeApi: playground.activeApi,
            terminalTail: playground.activeTerminalData,
            toolCallId,
            updateStepMock: playground.updateStepMock,
            requestApproval: approvals.request,
        };

        try {
            const outcome = await registry.execute(selectedTool, JSON.stringify(parsed), ctx);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id !== toolCallId
                        ? m
                        : outcome.ok
                          ? { ...m, status: "done", resultText: outcome.resultText }
                          : { ...m, status: "error", errorText: outcome.errorText }
                )
            );
        } finally {
            setIsRunning(false);
        }
    };

    const clearHistory = () => setMessages([]);

    return (
        <Popup isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 pr-12">
                    <span className="text-base font-semibold text-gray-900">🔧 Tool Inspector</span>
                    <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        dev
                    </span>
                </div>
                <p className="text-[11px] text-gray-600">
                    Run any registered tool directly against the live playground context — no LLM in
                    the loop. Use this to evaluate tool quality and inputs/outputs.
                </p>

                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wide text-text-secondary">
                        Tool
                    </label>
                    <Combobox
                        items={toolDefs.map((t) => t.function.name)}
                        value={selectedTool || null}
                        onValueChange={(value) => setSelectedTool(value ?? "")}
                    >
                        <ComboboxInput placeholder="Select a tool..." className="w-full" />
                        <ComboboxContent>
                            <ComboboxEmpty>No tools found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item) => (
                                    <ComboboxItem key={item} value={item}>
                                        {item}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                {currentTool && (
                    <div className="text-[11px] text-gray-700 bg-gray-50 border border-gray-200 rounded p-2">
                        {currentTool.function.description}
                    </div>
                )}

                {currentTool && (
                    <div>
                        <Button
                            type="button"
                            variant="link"
                            size="xs"
                            onClick={() => setShowSchema((v) => !v)}
                            className="h-auto p-0 text-[11px]"
                        >
                            {showSchema ? "Hide" : "Show"} parameter schema
                        </Button>
                        {showSchema && (
                            <pre className="font-mono text-[10px] whitespace-pre-wrap wrap-break-word bg-gray-50 border border-gray-200 rounded p-2 mt-1 max-h-40 overflow-auto">
                                {JSON.stringify(currentTool.function.parameters, null, 2)}
                            </pre>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] uppercase tracking-wide text-gray-500">
                            Args (JSON)
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={resetStub}
                            title="Regenerate stub args from schema"
                            className="h-auto gap-1 p-0 text-[11px]"
                        >
                            <ArrowUturnLeftIcon className="size-2.5" /> Reset stub
                        </Button>
                    </div>
                    <textarea
                        value={argsJson}
                        onChange={(e) => setArgsJson(e.target.value)}
                        rows={10}
                        spellCheck={false}
                        className="font-mono text-[11px] border bg-white border-gray-300 rounded p-2 resize-y"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={run}
                        disabled={isRunning || !selectedTool}
                        isLoading={isRunning}
                    >
                        {!isRunning && <PlayIcon className="size-3" />}
                        {isRunning ? "Running…" : "Run"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearHistory}
                        disabled={messages.length === 0}
                    >
                        Clear results
                    </Button>
                </div>

                <div className="border-t border-gray-200 pt-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                        Results
                    </div>
                    <InspectorMessageList messages={messages} />
                </div>
            </div>
        </Popup>
    );
};
