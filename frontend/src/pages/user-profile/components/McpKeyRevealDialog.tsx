import { Alert } from "@components/Shadcn/Alert";
import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import CodeBlock from "@components/CodeBlock";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { formatMcpKeyDate } from "@pages/user-profile/utils/formatMcpKeyDate";
import type { IMcpKeyRevealDialogProps } from "@pages/user-profile/types";

const copy = PROFILE_PAGE_COPY.mcpKey;

/**
 * Shows the plaintext key, once.
 *
 * Deliberately hard to dismiss: a stray backdrop click or Escape press would
 * lose a credential the user cannot recover, so only the explicit
 * "I've saved it" button closes it.
 */
export const McpKeyRevealDialog = ({ keyValue, expiresAt, onDone }: IMcpKeyRevealDialogProps) => (
    <Dialog open={Boolean(keyValue)}>
        <DialogContent
            className="max-w-2xl"
            showCloseButton={false}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
        >
            <DialogHeader>
                <DialogTitle>{copy.revealTitle}</DialogTitle>
                <DialogDescription>{copy.revealDescription}</DialogDescription>
            </DialogHeader>

            <Alert variant="warning" message={copy.revealWarning} />

            {/* wrap: the key is 52 characters and must not be clipped. */}
            <CodeBlock code={keyValue ?? ""} wrap />

            {expiresAt ? (
                <p className="text-caption-1 text-text-secondary">
                    Expires {formatMcpKeyDate(expiresAt)}
                </p>
            ) : null}

            <div className="flex justify-end">
                <Button onClick={onDone}>{copy.revealDone}</Button>
            </div>
        </DialogContent>
    </Dialog>
);

export default McpKeyRevealDialog;
