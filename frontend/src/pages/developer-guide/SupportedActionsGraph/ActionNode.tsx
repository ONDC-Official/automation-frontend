import { type FC, useContext, memo } from "react";
import { type Node, type NodeProps, Handle, Position } from "@xyflow/react";
import { useTheme } from "@/context/theme/themeContext";
import { GraphCtx } from "./graphContext";
import { NODE_W, NODE_H } from "./computeLayout";

export interface ActionNodeData extends Record<string, unknown> {
    label: string;
    isEntry: boolean;
    isResponse: boolean;
    nextCount: number;
    historyCount: number;
}

export const ActionNode: FC<NodeProps<Node<ActionNodeData>>> = memo(({ data }) => {
    const { label, isEntry, isResponse, nextCount, historyCount } = data;
    const ctx = useContext(GraphCtx);
    const { isDark } = useTheme();

    const isFocused = ctx.focused === label;
    const isNext = ctx.focused !== null && (ctx.actionMap[ctx.focused] ?? []).includes(label);
    const isHistory =
        ctx.focused !== null &&
        ((ctx.apiProperties[ctx.focused]?.transaction_partner ?? []).includes(label) ||
            ctx.apiProperties[ctx.focused]?.async_predecessor === label);
    const isDimmed = ctx.focused !== null && !isFocused && !isNext && !isHistory;

    const accentColor = isEntry ? "#10b981" : isResponse ? "#818cf8" : "#38bdf8";
    const borderColor = isFocused
        ? "#0ea5e9"
        : isNext
          ? "#7dd3fc"
          : isHistory
            ? "#fbbf24"
            : isDark
              ? "#334155"
              : "#e2e8f0";
    const bgColor = isDark
        ? isEntry
            ? "#06241a"
            : isResponse
              ? "#1c1a33"
              : "#141414"
        : isEntry
          ? "#f0fdf4"
          : isResponse
            ? "#eef2ff"
            : "#ffffff";
    const boxShadow = isFocused
        ? "0 0 0 3px rgba(14,165,233,0.22), 0 4px 14px rgba(14,165,233,0.14)"
        : isNext
          ? "0 0 0 2px rgba(125,211,252,0.45)"
          : isHistory
            ? "0 0 0 2px rgba(251,191,36,0.45)"
            : isDark
              ? "0 1px 3px rgba(0,0,0,0.5)"
              : "0 1px 3px rgba(0,0,0,0.06)";

    const typeLabel = isEntry ? "Entry" : isResponse ? "Response" : "Request";
    const typePill = isDark
        ? isEntry
            ? { bg: "#064e3b40", text: "#6ee7b7", border: "#10b98155" }
            : isResponse
              ? { bg: "#312e8140", text: "#a5b4fc", border: "#818cf855" }
              : { bg: "#0c4a6e40", text: "#7dd3fc", border: "#38bdf855" }
        : isEntry
          ? { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" }
          : isResponse
            ? { bg: "#eef2ff", text: "#4338ca", border: "#a5b4fc" }
            : { bg: "#f0f9ff", text: "#0369a1", border: "#7dd3fc" };

    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    width: 10,
                    height: 10,
                    background: accentColor,
                    border: "2px solid white",
                    boxShadow: `0 0 0 1px ${accentColor}40`,
                }}
            />
            <div
                onClick={() => ctx.toggleFocus(label)}
                onMouseEnter={(e) => ctx.onHover(label, e.clientX, e.clientY)}
                onMouseMove={(e) => ctx.onHover(label, e.clientX, e.clientY)}
                onMouseLeave={() => ctx.onHover(null, 0, 0)}
                style={{
                    width: NODE_W,
                    height: NODE_H,
                    background: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 12,
                    display: "flex",
                    overflow: "hidden",
                    boxShadow,
                    cursor: "pointer",
                    opacity: isDimmed ? 0.16 : 1,
                    transition:
                        "opacity 0.25s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                    userSelect: "none",
                }}
            >
                {/* Left accent bar */}
                <div
                    style={{
                        width: 4,
                        flexShrink: 0,
                        background: `linear-gradient(180deg, ${accentColor}dd 0%, ${accentColor}88 100%)`,
                    }}
                />
                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: "0 11px",
                        gap: 5,
                        overflow: "hidden",
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                            fontWeight: 700,
                            fontSize: 13,
                            color: isFocused
                                ? isDark
                                    ? "#7dd3fc"
                                    : "#0c4a6e"
                                : isDark
                                  ? "#f1f5f9"
                                  : "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.25,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {label}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexWrap: "nowrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: "0.07em",
                                textTransform: "uppercase",
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: typePill.bg,
                                color: typePill.text,
                                border: `1px solid ${typePill.border}`,
                                lineHeight: "14px",
                                flexShrink: 0,
                            }}
                        >
                            {typeLabel}
                        </span>
                        {nextCount > 0 && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: isDark ? "#0c4a6e40" : "#f0f9ff",
                                    color: isDark ? "#7dd3fc" : "#0284c7",
                                    border: isDark ? "1px solid #38bdf855" : "1px solid #bae6fd",
                                    lineHeight: "14px",
                                    flexShrink: 0,
                                }}
                            >
                                → {nextCount}
                            </span>
                        )}
                        {historyCount > 0 && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: isDark ? "#78350f40" : "#fffbeb",
                                    color: isDark ? "#fcd34d" : "#92400e",
                                    border: isDark ? "1px solid #fbbf2455" : "1px solid #fde68a",
                                    lineHeight: "14px",
                                    flexShrink: 0,
                                }}
                            >
                                ↑ {historyCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: 10,
                    height: 10,
                    background: accentColor,
                    border: "2px solid white",
                    boxShadow: `0 0 0 1px ${accentColor}40`,
                }}
            />
        </>
    );
});
ActionNode.displayName = "ActionNode";

export const nodeTypes = { action: ActionNode };
