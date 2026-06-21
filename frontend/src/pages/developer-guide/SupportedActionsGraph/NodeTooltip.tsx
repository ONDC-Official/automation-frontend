import { type FC } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/theme/themeContext";
import type { ApiProps } from "./graphContext";

interface TooltipProps {
    api: string;
    x: number;
    y: number;
    actionMap: Record<string, string[]>;
    apiProperties: Record<string, ApiProps>;
    entryPoints: Set<string>;
}

export const NodeTooltip: FC<TooltipProps> = ({
    api,
    x,
    y,
    actionMap,
    apiProperties,
    entryPoints,
}) => {
    const { isDark } = useTheme();
    const nextActions = actionMap[api] ?? [];
    const history = apiProperties[api]?.transaction_partner ?? [];
    const asyncPred = apiProperties[api]?.async_predecessor ?? null;
    const isEntry = entryPoints.has(api);
    const isResponse = api.startsWith("on_");

    const typeLabel = isEntry ? "Entry" : isResponse ? "Response" : "Request";
    const typeColor = isDark
        ? isEntry
            ? "#34d399"
            : isResponse
              ? "#a5b4fc"
              : "#7dd3fc"
        : isEntry
          ? "#059669"
          : isResponse
            ? "#6366f1"
            : "#0284c7";
    const typeAlpha = isEntry ? "#05996918" : isResponse ? "#6366f118" : "#0284c718";
    const typeBorder = isEntry ? "#05996930" : isResponse ? "#6366f130" : "#0284c730";

    const tipX = Math.min(x + 18, window.innerWidth - 308);
    const tipY = y + 14;

    const card = {
        bg: isDark ? "#171717" : "#ffffff",
        border: isDark ? "#2a2a2a" : "#e2e8f0",
        headerFrom: isDark ? "#1a1a1a" : "#f8fafc",
        headerTo: isDark ? "#141414" : "#f1f5f9",
        title: isDark ? "#f1f5f9" : "#0f172a",
        muted: isDark ? "#71717a" : "#94a3b8",
        footerBg: isDark ? "#141414" : "#fafafa",
        footerBorder: isDark ? "#262626" : "#f1f5f9",
        purpleBg: isDark ? "#2e1065" : "#f5f3ff",
        purpleBorder: isDark ? "#5b21b655" : "#ddd6fe",
        purpleText: isDark ? "#c4b5fd" : "#5b21b6",
        purpleAccent: isDark ? "#a78bfa" : "#a78bfa",
        purpleStrong: isDark ? "#c4b5fd" : "#4f46e5",
        skyText: isDark ? "#7dd3fc" : "#0284c7",
        skyChipBg: isDark ? "#0c4a6e40" : "#f0f9ff",
        skyChipBorder: isDark ? "#38bdf855" : "#bae6fd",
        skyChipText: isDark ? "#7dd3fc" : "#0369a1",
        amberText: isDark ? "#fbbf24" : "#b45309",
        amberChipBg: isDark ? "#78350f40" : "#fffbeb",
        amberChipBorder: isDark ? "#fbbf2455" : "#fde68a",
        amberChipText: isDark ? "#fcd34d" : "#92400e",
    };

    return createPortal(
        <div
            style={{
                position: "fixed",
                left: tipX,
                top: tipY,
                zIndex: 99999,
                pointerEvents: "none",
                width: 292,
            }}
        >
            <div
                style={{
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    borderRadius: 14,
                    boxShadow: "0 12px 40px rgba(15,23,42,0.13), 0 3px 10px rgba(15,23,42,0.07)",
                    overflow: "hidden",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: `linear-gradient(135deg, ${card.headerFrom} 0%, ${card.headerTo} 100%)`,
                        borderBottom: `1px solid ${card.border}`,
                        padding: "11px 14px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                            fontWeight: 700,
                            fontSize: 14,
                            color: card.title,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {api}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: 5,
                            background: typeAlpha,
                            color: typeColor,
                            border: `1px solid ${typeBorder}`,
                            flexShrink: 0,
                        }}
                    >
                        {typeLabel}
                    </span>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: "11px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                    }}
                >
                    {asyncPred && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 7,
                                background: card.purpleBg,
                                border: `1px solid ${card.purpleBorder}`,
                                borderRadius: 8,
                                padding: "7px 10px",
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                style={{ marginTop: 1, flexShrink: 0 }}
                            >
                                <circle
                                    cx="6"
                                    cy="6"
                                    r="5"
                                    fill="none"
                                    stroke={card.purpleAccent}
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M6 4v3M6 8.5v.3"
                                    stroke={card.purpleAccent}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: card.purpleText,
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                Async response to{" "}
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontWeight: 700,
                                        color: card.purpleStrong,
                                    }}
                                >
                                    {asyncPred}
                                </span>
                                {" — "}must share the same{" "}
                                <span style={{ fontWeight: 700 }}>message_id</span>
                            </p>
                        </div>
                    )}

                    {/* Valid Next */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 7,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: card.skyText,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                }}
                            >
                                Valid Next
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: card.skyText,
                                    background: card.skyChipBg,
                                    border: `1px solid ${card.skyChipBorder}`,
                                    borderRadius: "50%",
                                    width: 18,
                                    height: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {nextActions.length}
                            </span>
                        </div>
                        {nextActions.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {nextActions.map((n) => (
                                    <span
                                        key={n}
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: 6,
                                            background: card.skyChipBg,
                                            color: card.skyChipText,
                                            border: `1px solid ${card.skyChipBorder}`,
                                        }}
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: card.muted,
                                    fontStyle: "italic",
                                    margin: 0,
                                }}
                            >
                                Terminal action — no valid successors
                            </p>
                        )}
                    </div>

                    {/* Required History */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 7,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: card.amberText,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                }}
                            >
                                Required History
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: card.amberText,
                                    background: card.amberChipBg,
                                    border: `1px solid ${card.amberChipBorder}`,
                                    borderRadius: "50%",
                                    width: 18,
                                    height: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {history.length}
                            </span>
                        </div>
                        {history.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {history.map((h) => (
                                    <span
                                        key={h}
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: 6,
                                            background: card.amberChipBg,
                                            color: card.amberChipText,
                                            border: `1px solid ${card.amberChipBorder}`,
                                        }}
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: card.muted,
                                    fontStyle: "italic",
                                    margin: 0,
                                }}
                            >
                                No prior history required
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "7px 14px",
                        borderTop: `1px solid ${card.footerBorder}`,
                        background: card.footerBg,
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            color: card.muted,
                            fontStyle: "italic",
                            margin: 0,
                        }}
                    >
                        Click to focus · explore connections
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
