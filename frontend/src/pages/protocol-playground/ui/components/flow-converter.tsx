import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";
import { generatePlaygroundConfigFromFlowConfigWithMeta } from "@ondc/automation-mock-runner";

interface VersionItem {
    key: string;
}

interface DomainItem {
    key: string;
    version?: VersionItem[];
}

interface DynamicList {
    domain: DomainItem[];
    version: VersionItem[];
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

type FlowConverterModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

function CopyButton({ getValue }: { getValue: () => string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = getValue();
        if (!text.trim()) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                copied
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-white text-gray-500 hover:text-sky-700 hover:bg-sky-50 border border-gray-200 hover:border-sky-200"
            }`}
        >
            {copied ? (
                <>
                    <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Copied
                </>
            ) : (
                <>
                    <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    Copy
                </>
            )}
        </button>
    );
}

export const FlowConverterModal = ({ isOpen, onClose }: FlowConverterModalProps) => {
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
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
                );
                setDynamicList((prev) => ({
                    ...prev,
                    domain: response.data.domain || [],
                    version: response.data.version || [],
                }));
            } catch (e) {
                console.error("error while fetching form field data", e);
            }
        };
        fetchFormData();
    }, [isOpen]);

    if (!isOpen) return null;

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

            const output = results.length === 1 ? results[0] : results;
            setOutputValue(serializeOutput(output, format));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Conversion failed");
        } finally {
            setIsConverting(false);
        }
    };

    const selectClass =
        "px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200";

    const editorLang = detectedFormat === "yaml" ? "yaml" : "json";
    const formatBadge =
        detectedFormat === "yaml"
            ? "bg-amber-50 text-amber-600 border-amber-200"
            : "bg-sky-50 text-sky-600 border-sky-200";

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col mt-20">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
                {/* Left: back + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-sky-700 hover:bg-sky-50 border border-gray-200 hover:border-sky-200 transition-all duration-200"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </button>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 bg-sky-100 rounded-lg">
                            <svg
                                className="w-3.5 h-3.5 text-sky-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                            </svg>
                        </div>
                        <h2 className="text-sm font-semibold text-gray-900">Flow Converter</h2>
                    </div>
                    {inputValue.trim() && (
                        <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${formatBadge}`}
                        >
                            {detectedFormat}
                        </span>
                    )}
                </div>

                {/* Center: Domain + Version */}
                <div className="flex items-center gap-3">
                    {dynamicList.domain.length > 0 ? (
                        <select
                            value={domain}
                            onChange={(e) => {
                                setDomain(e.target.value);
                                const selected = dynamicList.domain.find(
                                    (d) => d.key === e.target.value
                                );
                                if (selected) {
                                    setDynamicList((prev) => ({
                                        ...prev,
                                        version: selected.version || [],
                                    }));
                                }
                                setVersion("");
                            }}
                            className={selectClass}
                        >
                            <option value="">Select domain...</option>
                            {dynamicList.domain.map((d) => (
                                <option key={d.key} value={d.key}>
                                    {d.key}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Domain"
                            className={selectClass + " placeholder-gray-400 w-36"}
                        />
                    )}

                    {dynamicList.version.length > 0 ? (
                        <select
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Select version...</option>
                            {dynamicList.version.map((v) => (
                                <option key={v.key} value={v.key}>
                                    {v.key}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="Version"
                            className={selectClass + " placeholder-gray-400 w-32"}
                        />
                    )}

                    <div className="w-px h-5 bg-gray-200" />

                    <input
                        type="text"
                        value={usecase}
                        onChange={(e) => setUsecase(e.target.value)}
                        placeholder="Use Case ID"
                        className={selectClass + " placeholder-gray-400 w-36"}
                    />
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mx-5 mt-3 shrink-0 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-sm flex items-start gap-2">
                    <svg
                        className="w-4 h-4 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Editors */}
            <div className="flex flex-1 overflow-hidden">
                {/* Input panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Input
                            </span>
                            <span className="text-xs text-gray-400">
                                Flow Config · JSON or YAML · single or array
                            </span>
                        </div>
                        <CopyButton getValue={() => inputRef.current} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            theme="vs"
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

                {/* Center column */}
                <div className="w-16 flex flex-col items-center justify-center bg-gray-50 border-x border-gray-200 shrink-0 gap-4">
                    <button
                        onClick={handleConvert}
                        disabled={isConverting || !inputValue.trim() || !domain || !version}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 transition-all duration-200 shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-300 disabled:shadow-none group w-11"
                        title={!domain || !version ? "Select domain and version first" : "Convert"}
                    >
                        {isConverting ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-150"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        )}
                    </button>
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                    </div>
                </div>

                {/* Output panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Output
                            </span>
                            <span className="text-xs text-gray-400">
                                Playground Config · read-only
                            </span>
                        </div>
                        <CopyButton getValue={() => outputRef.current} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            theme="vs"
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
        </div>
    );
};
