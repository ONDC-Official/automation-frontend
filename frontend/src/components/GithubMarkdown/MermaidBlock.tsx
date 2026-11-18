import { type FC, useEffect, useId, useState } from "react";
import { useTheme } from "@/theme/hooks/useTheme";

interface MermaidBlockProps {
    source: string;
}

// Resolved copies of this app's own design tokens (src/styles/tokens.css).
// Mermaid's theme engine needs concrete, parseable color values for its internal
// color math (lighten/darken) — passing raw `var(--token)` strings throws
// "Unsupported color format", so these are hex snapshots, one per mode.
const PALETTE = {
    light: {
        background: "#fafafb",
        foreground: "#172b4d",
        card: "#ffffff",
        border: "#dfe1e6",
        muted: "#f4f5f7",
        mutedForeground: "#42526e",
        primary: "#0081cc",
    },
    dark: {
        background: "#000000",
        foreground: "#fafafb",
        card: "#141414",
        border: "#2a2a2a",
        muted: "#1a1a1a",
        mutedForeground: "#97a0af",
        primary: "#0081cc",
    },
};

// Per-actor colors for sequence diagrams only (flowcharts stay neutral unless the
// diagram sets its own classDef colors).
//
// ONDC roles get a fixed color, so a buyer app, seller app, Gateway or Registry
// looks the same in every diagram of the guide. The docs' flowcharts use the same
// four hues for the same roles. Any other participant ("Sender", "NP1", "Key
// cache", ...) gets the next color from FALLBACK, in left-to-right order.
type ActorColor = { fill: string; border: string };
type Role = "buyer" | "seller" | "gateway" | "registry";

const ROLE_PALETTE: Record<"light" | "dark", Record<Role, ActorColor>> = {
    light: {
        buyer: { fill: "#eff6ff", border: "#3b82f6" }, // blue
        seller: { fill: "#ecfdf5", border: "#10b981" }, // green
        gateway: { fill: "#fffbeb", border: "#f59e0b" }, // amber
        registry: { fill: "#f5f3ff", border: "#8b5cf6" }, // violet
    },
    dark: {
        buyer: { fill: "#0b1e3d", border: "#60a5fa" },
        seller: { fill: "#052e22", border: "#34d399" },
        gateway: { fill: "#3a2a05", border: "#fbbf24" },
        registry: { fill: "#1e1033", border: "#a78bfa" },
    },
};

const FALLBACK_PALETTE: Record<"light" | "dark", ActorColor[]> = {
    light: [
        { fill: "#fdf2f8", border: "#ec4899" }, // pink
        { fill: "#ecfeff", border: "#06b6d4" }, // cyan
        { fill: "#fff7ed", border: "#f97316" }, // orange
        { fill: "#f8fafc", border: "#64748b" }, // slate
    ],
    dark: [
        { fill: "#3b0a28", border: "#f472b6" },
        { fill: "#06282c", border: "#22d3ee" },
        { fill: "#3a1d05", border: "#fb923c" },
        { fill: "#1e293b", border: "#94a3b8" },
    ],
};

/** The ONDC role an actor's label names, or null when it names none or both sides. */
function actorRole(label: string): Role | null {
    const name = label.toLowerCase();
    if (/gateway|\bbg\b/.test(name)) return "gateway";
    if (/registry/.test(name)) return "registry";
    const buyer = /\bbap\b|buyer|complainant/.test(name);
    const seller = /\bbpp\b|seller|respondent/.test(name);
    if (buyer && !seller) return "buyer";
    if (seller && !buyer) return "seller";
    return null;
}

// Mermaid's own stylesheet sets `.actor { fill; stroke }`, and CSS outranks SVG
// presentation attributes, so the color has to go in an inline style to show.
function paintActor(rect: Element, color: ActorColor): void {
    rect.setAttribute("style", `fill: ${color.fill}; stroke: ${color.border};`);
}

function colorizeActors(svgString: string, isDark: boolean): string {
    if (!svgString.includes('class="actor')) return svgString; // not a sequence diagram

    const mode = isDark ? "dark" : "light";
    const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.documentElement;

    // Mermaid gives the top actor boxes' parent <g> a `root-{n}` id, but n is a
    // page-lifetime counter, so sort by x (left-to-right = declaration order). The
    // duplicate boxes at the bottom get no id; they are matched by the same x.
    const topGroups = Array.from(svgEl.querySelectorAll('g[id^="root-"]'))
        .map((g) => ({ g, rect: g.querySelector("rect.actor") }))
        .filter((e): e is { g: Element; rect: Element } => e.rect !== null)
        .sort(
            (a, b) =>
                parseFloat(a.rect.getAttribute("x") ?? "0") -
                parseFloat(b.rect.getAttribute("x") ?? "0")
        );

    const xToColor = new Map<string, ActorColor>();
    let fallbackIndex = 0;
    topGroups.forEach(({ g, rect }) => {
        const role = actorRole(g.textContent ?? "");
        const fallback = FALLBACK_PALETTE[mode];
        const color = role ? ROLE_PALETTE[mode][role] : fallback[fallbackIndex++ % fallback.length];
        paintActor(rect, color);
        const x = rect.getAttribute("x");
        if (x) xToColor.set(x, color);
    });

    svgEl.querySelectorAll("rect.actor-bottom").forEach((rect) => {
        const x = rect.getAttribute("x");
        const color = x ? xToColor.get(x) : undefined;
        if (!color) return;
        paintActor(rect, color);
    });

    return new XMLSerializer().serializeToString(svgEl);
}

/**
 * Renders a ```mermaid fenced code block as an actual diagram, same on-demand
 * dynamic-import + mermaid.render() approach as SequenceDiagramPanel. Themed to
 * match this app's own neutral gray/white design instead of mermaid's default
 * purple/yellow palette.
 */
const MermaidBlock: FC<MermaidBlockProps> = ({ source }) => {
    const reactId = useId().replace(/:/g, "");
    const containerId = `md-mermaid-${reactId}`;
    const { isDark } = useTheme();
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            setLoading(true);
            setError(null);
            try {
                // Mermaid measures label text (via a hidden DOM pass) to size each
                // node/cluster box before painting the real SVG. If a font weight
                // used in the label (e.g. the <b> in a two-tier label) hasn't
                // finished loading yet, that measurement uses fallback-font metrics
                // — narrower than Inter's real glyphs — so the box gets sized too
                // small and the real text clips once the web font paints in.
                // `fonts.ready` alone isn't enough: it only waits for weights the
                // already-visible page happens to need, and mermaid's measurement
                // pass runs in a hidden/detached element that may not register as
                // "needing" a weight yet. Explicitly loading the exact
                // weight/size pairs the labels use removes that gap.
                if (typeof document !== "undefined" && document.fonts) {
                    await Promise.all([
                        document.fonts.load("700 13px Inter"),
                        document.fonts.load("400 13px Inter"),
                        document.fonts.ready,
                    ]).catch(() => undefined);
                }
                const mermaid = (await import("mermaid")).default;
                const c = isDark ? PALETTE.dark : PALETTE.light;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "strict",
                    theme: "base",
                    themeVariables: {
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        background: c.background,
                        primaryColor: c.card,
                        primaryTextColor: c.foreground,
                        primaryBorderColor: c.border,
                        secondaryColor: c.muted,
                        secondaryBorderColor: c.border,
                        tertiaryColor: c.muted,
                        tertiaryBorderColor: c.border,
                        lineColor: c.mutedForeground,
                        textColor: c.foreground,
                        mainBkg: c.card,
                        clusterBkg: c.muted,
                        clusterBorder: c.border,
                        edgeLabelBackground: c.background,
                        nodeBorder: c.border,
                        titleColor: c.foreground,
                        actorBkg: c.card,
                        actorBorder: c.border,
                        actorTextColor: c.foreground,
                        actorLineColor: c.border,
                        signalColor: c.mutedForeground,
                        signalTextColor: c.foreground,
                        labelBoxBkgColor: c.card,
                        labelBoxBorderColor: c.border,
                        labelTextColor: c.foreground,
                        loopTextColor: c.foreground,
                        noteBkgColor: c.muted,
                        noteBorderColor: c.border,
                        noteTextColor: c.foreground,
                    },
                    flowchart: {
                        htmlLabels: true,
                        curve: "basis",
                        diagramPadding: 4,
                        nodeSpacing: 24,
                        rankSpacing: 36,
                        padding: 8,
                    },
                });
                const { svg: rendered } = await mermaid.render(
                    `${containerId}-${Date.now()}`,
                    source
                );
                if (!cancelled) setSvg(colorizeActors(rendered, isDark));
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to render diagram");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void render();
        return () => {
            cancelled = true;
        };
    }, [source, isDark, containerId]);

    if (error) {
        return (
            <div className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                Could not render diagram: {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-4 h-40 animate-pulse rounded-lg border border-border bg-muted/40" />
        );
    }

    return (
        <div
            className="my-4 min-w-0 max-w-full overflow-x-auto rounded-lg border border-border bg-background p-4 [&_svg]:mx-auto [&_svg]:block [&_svg]:min-w-[560px]"
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
    );
};

export default MermaidBlock;
