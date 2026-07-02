import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";
import { generatePlaygroundConfigFromFlowConfigWithMeta } from "@ondc/automation-mock-runner";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowsRightLeftIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/Shadcn/Dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Shadcn/Select/select";
import { cn } from "@/lib/utils";
import { useAppliedTheme } from "@/context/theme/useAppliedTheme";
import { useClipboard } from "@hooks/useClipboard";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import type { IScenarioDomainItem } from "@pages/protocol-playground/ui/starter/types";
import type { IFlowConverterModalProps } from "@pages/protocol-playground/ui/types";

interface DynamicList {
    domain: IScenarioDomainItem[];
    version: { key: string }[];
}

type InputFormat = "json" | "yaml";

function detectFormat(raw: string): InputFormat {
    const trimmed = raw.trim();
    try {
        JSON.parse(trimmed);
        return "json";
    } catch {
        return "yaml";
    }
}

function parseInput(raw: string, format: InputFormat): unknown {
    if (format === "json") return JSON.parse(raw);
    return yamlParse(raw);
}

function serializeOutput(value: unknown, format: InputFormat): string {
    if (format === "json") return JSON.stringify(value, null, 2);
    return yamlStringify(value);
}

const CopyButton = ({ getValue }: { getValue: () => string }) => {
    const { copyToClipboard } = useClipboard();

    const handleCopy = async () => {
        const text = getValue();
        if (!text.trim()) return;
        await copyToClipboard(text);
    };

    return (
        <Button size="xs" variant="outline" onClick={handleCopy}>
            <ClipboardDocumentIcon className="size-3.5" />
            Copy
        </Button>
    );
};

export const FlowConverterModal = ({ isOpen, onClose }: IFlowConverterModalProps) => {
    const appliedTheme = useAppliedTheme();
    const [domain, setDomain] = useState("");
    const [version, setVersion] = useState("");
    const [usecase, setUsecase] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [outputValue, setOutputValue] = useState("");
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<InputFormat>("json");
    const [dynamicList, setDynamicList] = useState<DynamicList>({ domain: [], version: [] });
    const inputRef = useRef(inputValue);
    const outputRef = useRef(outputValue);
    inputRef.current = inputValue;
    outputRef.current = outputValue;

    useEffect(() => {
        if (!isOpen) return;
        const fetchFormData = async () => {
            try {
                const response = await apiClient.get<{
                    domain?: IScenarioDomainItem[];
                    version?: { key: string }[];
                }>(API_ROUTES.CONFIG.SCENARIO_FORM_DATA);
                setDynamicList((prev) => ({
                    ...prev,
                    domain: response.data.domain ?? [],
                    version: response.data.version ?? [],
                }));
            } catch (e) {
                console.error("error while fetching form field data", e);
            }
        };
        fetchFormData();
    }, [isOpen]);

    const handleInputChange = (v: string | undefined) => {
        const val = v || "";
        setInputValue(val);
        if (val.trim()) {
            setDetectedFormat(detectFormat(val));
        }
    };

    const handleConvert = async () => {
        setError(null);
        setIsConverting(true);
        try {
            const format = detectFormat(inputValue);
            setDetectedFormat(format);
            const parsed = parseInput(inputValue, format);

            const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

            const results = await Promise.all(
                items.map((item) =>
                    generatePlaygroundConfigFromFlowConfigWithMeta(
                        [],
                        item as Parameters<
                            typeof generatePlaygroundConfigFromFlowConfigWithMeta
                        >[1],
                        domain,
                        version
                    )
                )
            );

            if (usecase.trim()) {
                results.forEach((r) => {
                    if (
                        r &&
                        typeof r === "object" &&
                        "meta" in r &&
                        r.meta &&
                        typeof r.meta === "object"
                    ) {
                        (r.meta as Record<string, unknown>).use_case_id = usecase.trim();
                    }
                });
            }

            const result = results.length === 1 ? results[0] : results;
            setOutputValue(serializeOutput(result, format));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Conversion failed");
        } finally {
            setIsConverting(false);
        }
    };

    const editorLang = detectedFormat === "yaml" ? "yaml" : "json";
    const editorTheme = appliedTheme === "dark" ? "vs-dark" : "vs";
    const formatBadge =
        detectedFormat === "yaml"
            ? "bg-alert-50 text-alert-500 border-alert-200"
            : "bg-brand-light text-brand-normal border-brand-light-active";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
            >
                <DialogTitle className="sr-only">Flow Converter</DialogTitle>

                <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-surface-elevated px-5 py-3">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            <ArrowLeftIcon className="size-4" />
                            Back
                        </Button>
                        <div className="h-5 w-px bg-border-default" />
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-brand-light dark:bg-surface-muted">
                                <ArrowsRightLeftIcon className="size-3.5 text-brand-normal" />
                            </div>
                            <h2 className="text-sm font-semibold text-text-primary">
                                Flow Converter
                            </h2>
                        </div>
                        {inputValue.trim() && (
                            <span
                                className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                    formatBadge
                                )}
                            >
                                {detectedFormat}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {dynamicList.domain.length > 0 ? (
                            <Select
                                value={domain}
                                onValueChange={(value) => {
                                    setDomain(value);
                                    const selected = dynamicList.domain.find(
                                        (d) => d.key === value
                                    );
                                    if (selected) {
                                        setDynamicList((prev) => ({
                                            ...prev,
                                            version: selected.version || [],
                                        }));
                                    }
                                    setVersion("");
                                }}
                            >
                                <SelectTrigger size="sm" className="w-40">
                                    <SelectValue placeholder="Select domain..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {dynamicList.domain.map((d) => (
                                        <SelectItem key={d.key} value={d.key}>
                                            {d.key}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="Domain"
                                className="w-36"
                            />
                        )}

                        {dynamicList.version.length > 0 ? (
                            <Select value={version} onValueChange={setVersion}>
                                <SelectTrigger size="sm" className="w-32">
                                    <SelectValue placeholder="Select version..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {dynamicList.version.map((v) => (
                                        <SelectItem key={v.key} value={v.key}>
                                            {v.key}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type="text"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="Version"
                                className="w-32"
                            />
                        )}

                        <div className="h-5 w-px bg-border-default" />

                        <Input
                            type="text"
                            value={usecase}
                            onChange={(e) => setUsecase(e.target.value)}
                            placeholder="Use Case ID"
                            className="w-36"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mx-5 mt-3 flex shrink-0 items-start gap-2 rounded-lg border border-error-500/40 bg-error-50 px-4 py-2.5 text-sm text-error-500">
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-surface-muted px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-block size-2 rounded-full bg-brand-normal" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Input
                                </span>
                                <span className="text-xs text-text-secondary">
                                    Flow Config · JSON or YAML · single or array
                                </span>
                            </div>
                            <CopyButton getValue={() => inputRef.current} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                theme={editorTheme}
                                height="100%"
                                language={editorLang}
                                value={inputValue}
                                onChange={handleInputChange}
                                options={{
                                    fontSize: 13,
                                    lineNumbers: "on",
                                    automaticLayout: true,
                                    formatOnPaste: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: true,
                                    padding: { top: 12 },
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-4 border-x border-border-default bg-surface-muted">
                        <Button
                            size="icon"
                            onClick={handleConvert}
                            isLoading={isConverting}
                            disabled={isConverting || !inputValue.trim() || !domain || !version}
                            title={
                                !domain || !version ? "Select domain and version first" : "Convert"
                            }
                            className="rounded-xl"
                        >
                            {!isConverting && <ArrowRightIcon className="size-5" />}
                        </Button>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="size-1 rounded-full bg-border-default" />
                            <div className="size-1 rounded-full bg-border-default" />
                            <div className="size-1 rounded-full bg-border-default" />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-surface-muted px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-block size-2 rounded-full bg-success-500" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Output
                                </span>
                                <span className="text-xs text-text-secondary">
                                    Playground Config · read-only
                                </span>
                            </div>
                            <CopyButton getValue={() => outputRef.current} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                theme={editorTheme}
                                height="100%"
                                language={editorLang}
                                value={outputValue}
                                options={{
                                    fontSize: 13,
                                    lineNumbers: "on",
                                    automaticLayout: true,
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: true,
                                    padding: { top: 12 },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
