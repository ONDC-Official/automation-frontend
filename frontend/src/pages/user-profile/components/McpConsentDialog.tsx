import { useEffect, useState } from "react";
import { Alert } from "@components/Shadcn/Alert";
import { Button } from "@components/Shadcn/Button";
import { Checkbox } from "@components/Shadcn/Checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import GithubMarkdown from "@components/GithubMarkdown";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { MCP_CONSENT_MARKDOWN, MCP_CONSENT_VERSION } from "@pages/user-profile/mcpConsent";
import type { IMcpConsentDialogProps } from "@pages/user-profile/types";

const copy = PROFILE_PAGE_COPY.mcpKey;

/**
 * The consent gate in front of key issuance.
 *
 * The document is ~1,000 words, so it scrolls in its own region with the agree
 * controls pinned below it rather than trailing off the bottom.
 */
export const McpConsentDialog = ({
    open,
    onOpenChange,
    onConfirm,
    isSubmitting,
    isConsentStale,
}: IMcpConsentDialogProps) => {
    const [agreed, setAgreed] = useState(false);

    // Consent is per-issuance, not sticky: every open starts unticked, so
    // agreeing once does not silently authorise the next key.
    useEffect(() => {
        if (!open) {
            setAgreed(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col gap-0 p-0">
                <DialogHeader className="border-b border-border-default px-6 py-4">
                    <DialogTitle>{copy.consentTitle}</DialogTitle>
                    <DialogDescription>Version {MCP_CONSENT_VERSION}</DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <GithubMarkdown content={MCP_CONSENT_MARKDOWN} />
                </div>

                <div className="flex flex-col gap-4 border-t border-border-default px-6 py-4">
                    {isConsentStale ? (
                        <Alert
                            variant="warning"
                            message={copy.consentStaleMessage}
                            description={copy.consentStaleDescription}
                        />
                    ) : null}

                    <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                            checked={agreed}
                            onCheckedChange={(checked) => setAgreed(checked === true)}
                            disabled={isConsentStale}
                            className="mt-0.5 shrink-0"
                        />
                        <span className="text-body-2 text-text-primary">
                            {copy.consentCheckbox}
                        </span>
                    </label>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {copy.consentCancel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!agreed || isConsentStale}
                            isLoading={isSubmitting}
                        >
                            {copy.consentConfirm}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default McpConsentDialog;
