import { useRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
    ArrowDownTrayIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { useFullscreen } from "@pages/protocol-studio/hooks/use-fullscreen";
import { HELPERS_PATH } from "@pages/protocol-studio/hooks/use-helpers-typescript";
import { CODE_DIALOG_FILES } from "@pages/protocol-studio/ui/editor/constants";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { splitFileName } from "@pages/protocol-studio/ui/editor/inspector/constants";
import { TypesViewer } from "@pages/protocol-studio/ui/editor/types-viewer";
import type { ICodeDialogProps } from "@pages/protocol-studio/ui/editor/types";

/**
 * Popup for the config-level files opened from the header: helpers.ts (editable),
 * the raw config.json (read-only) and the generated types (read-only). Portals into the editor root, so it keeps
 * the Studio theme and still shows while the editor is fullscreen; its own
 * fullscreen button takes the popup alone to the whole screen.
 */
export const CodeDialog = ({
    file,
    onClose,
    container,
    helpers,
    onHelpersChange,
    configJson,
    onDownloadConfig,
    reveal,
    typeFiles,
    typesSummary,
}: ICodeDialogProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(contentRef);
    const meta = file ? CODE_DIALOG_FILES[file] : null;
    const { base, ext } = splitFileName(meta?.label ?? "");

    return (
        <DialogPrimitive.Root open={file !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay className="studio-dialog-overlay" />
                <DialogPrimitive.Content
                    ref={contentRef}
                    className="studio-glass studio-code-dialog"
                    data-fullscreen={isFullscreen || undefined}
                    // Esc inside Monaco closes its widgets, not the popup.
                    onEscapeKeyDown={(e) => {
                        if (e.target instanceof Element && e.target.closest(".monaco-editor")) {
                            e.preventDefault();
                        }
                    }}
                >
                    {meta ? (
                        <>
                            <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                                <meta.Icon className="studio-code-dialog-icon" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                    <DialogPrimitive.Title className="studio-code-dialog-title">
                                        {base}
                                        <span className="studio-file-ext">{ext}</span>
                                    </DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="studio-text-dim truncate text-[12px]">
                                        {file === "types" ? typesSummary : meta.description}
                                    </DialogPrimitive.Description>
                                </div>
                                <span className="studio-badge">
                                    {file === "helpers"
                                        ? "draft · saved locally"
                                        : file === "types"
                                          ? "generated · read-only"
                                          : "read-only"}
                                </span>
                                {file === "config" ? (
                                    <button
                                        type="button"
                                        className="studio-key"
                                        onClick={onDownloadConfig}
                                        title="Download config.json"
                                    >
                                        <ArrowDownTrayIcon />
                                        Download
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    className="studio-key studio-key-icon"
                                    onClick={toggleFullscreen}
                                    aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? (
                                        <ArrowsPointingInIcon />
                                    ) : (
                                        <ArrowsPointingOutIcon />
                                    )}
                                </button>
                                <DialogPrimitive.Close
                                    className="studio-key studio-key-icon"
                                    aria-label="Close"
                                    title="Close"
                                >
                                    <XMarkIcon />
                                </DialogPrimitive.Close>
                            </header>

                            {file === "types" ? (
                                <TypesViewer files={typeFiles} />
                            ) : (
                                <div className="studio-well m-3 mt-1 min-h-0 flex-1">
                                    {file === "helpers" ? (
                                        <InspectorCodePane
                                            // The model useHelpersTypeScript keeps in the TypeScript
                                            // program, so step files see these signatures.
                                            path={HELPERS_PATH}
                                            language="typescript"
                                            value={helpers}
                                            onChange={onHelpersChange}
                                            reveal={reveal?.tab === "helpers" ? reveal : null}
                                            compileAs="helpers"
                                        />
                                    ) : (
                                        <InspectorCodePane
                                            path={`studio://config/${meta.label}`}
                                            language="json"
                                            value={configJson}
                                            readOnly
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default CodeDialog;
