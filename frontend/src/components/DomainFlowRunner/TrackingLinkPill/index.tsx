import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/Shadcn/Button";

/**
 * True when the delivered link points at a different origin than the one
 * serving this page.
 *
 * The provider infers the origin from its own base URL, so a deployment where
 * the mock service and the workbench are not co-hosted produces links that
 * resolve nowhere. That is invisible from the payload alone — this is the one
 * place an operator can notice it before a rider does.
 */
const isForeignOrigin = (url: string): boolean => {
    try {
        return new URL(url).origin !== window.location.origin;
    } catch {
        // Unparseable is its own kind of wrong, and worth the same flag.
        return true;
    }
};

/**
 * The provider-issued live tracking link for the current ride, as delivered to
 * the buyer in `message.tracking.url` on on_track.
 *
 * Shown to both sides: the seller checks what it handed over, the buyer opens
 * what it received. Anyone with the link can watch the ride, so treat it as
 * shareable — that is the point of it.
 */
export function TrackingLinkPill({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    const foreign = isForeignOrigin(url);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // Clipboard is unavailable outside a secure context; the link is
            // visible in the pill, so selecting it by hand still works.
            console.error("Failed to copy tracking link", e);
            toast.error("Couldn't copy — select the link to copy it manually");
        }
    };

    return (
        <div className="flex flex-col gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    🔗 Live tracking link
                </span>
                <code
                    className="min-w-0 flex-1 truncate font-mono text-[11px] text-emerald-900/80 dark:text-emerald-200/80"
                    title={url}
                >
                    {url}
                </code>
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={copy}
                    className="shrink-0 rounded-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 dark:bg-transparent dark:text-emerald-300"
                >
                    {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    asChild
                    className="shrink-0 rounded-full text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
                >
                    <a href={url} target="_blank" rel="noreferrer noopener">
                        Open
                    </a>
                </Button>
            </div>
            {foreign ? (
                <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                    This link points outside {window.location.origin} — the provider derives it from
                    the mock service&apos;s own origin, so it will only open if the two are served
                    from the same host.
                </p>
            ) : null}
        </div>
    );
}

export default TrackingLinkPill;
