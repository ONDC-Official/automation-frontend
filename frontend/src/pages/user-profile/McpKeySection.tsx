import { Alert } from "@components/Shadcn/Alert";
import { Button } from "@components/Shadcn/Button";
import { Card } from "@components/Shadcn/Card";
import { ConfirmDialog } from "@components/Shadcn/Dialog";
import Spinner from "@components/Shadcn/Spinner";
import { ProfilePageHeader } from "@pages/user-profile/ProfilePageHeader";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { McpConsentDialog } from "@pages/user-profile/components/McpConsentDialog";
import { McpKeyRevealDialog } from "@pages/user-profile/components/McpKeyRevealDialog";
import { useMcpKey } from "@pages/user-profile/hooks/useMcpKey";
import { formatMcpKeyDate } from "@pages/user-profile/utils/formatMcpKeyDate";

const copy = PROFILE_PAGE_COPY.mcpKey;

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-baseline justify-between gap-4 py-2">
        <span className="text-caption-1 text-text-secondary">{label}</span>
        <span className="text-body-2 font-medium text-text-primary">{value}</span>
    </div>
);

const McpKeySection = () => {
    const {
        status,
        isLoading,
        isConsentStale,
        isConsentOpen,
        openConsent,
        closeConsent,
        confirmConsent,
        isGenerating,
        issuedKey,
        issuedExpiresAt,
        dismissIssuedKey,
        isRevokeOpen,
        openRevoke,
        closeRevoke,
        confirmRevoke,
        isRevoking,
    } = useMcpKey();

    const hasKey = Boolean(status?.has_key);
    const isExpired = Boolean(status?.expired);

    return (
        <div className="min-w-0 flex-1 min-h-full py-6">
            <ProfilePageHeader title={copy.title} subtitle={copy.subtitle} />

            {isLoading && !status ? (
                <div className="flex justify-center py-12">
                    <Spinner className="size-8" />
                </div>
            ) : (
                <Card
                    title={copy.cardTitle}
                    description={hasKey ? copy.activeDescription : copy.emptyDescription}
                    headerAction={
                        hasKey ? null : (
                            <Button onClick={openConsent} disabled={isConsentStale}>
                                {copy.generate}
                            </Button>
                        )
                    }
                >
                    {hasKey ? (
                        <div className="flex flex-col gap-4">
                            {isExpired ? (
                                <Alert
                                    variant="warning"
                                    message={copy.expiredMessage}
                                    description={copy.expiredDescription}
                                />
                            ) : null}

                            <div className="divide-y divide-border-default">
                                <DetailRow label="Key" value={status?.key_hint ?? "—"} />
                                <DetailRow
                                    label="Created"
                                    value={formatMcpKeyDate(status?.created_at)}
                                />
                                <DetailRow
                                    label={isExpired ? "Expired" : "Expires"}
                                    value={formatMcpKeyDate(status?.expires_at)}
                                />
                                <DetailRow
                                    label="Last used"
                                    value={
                                        status?.last_used_at
                                            ? formatMcpKeyDate(status.last_used_at)
                                            : copy.neverUsed
                                    }
                                />
                                <DetailRow
                                    label="Terms accepted"
                                    value={status?.consent_version ?? "—"}
                                />
                            </div>

                            <p className="text-caption-1 text-text-secondary">
                                {copy.regenerateWarning}
                            </p>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={openRevoke}
                                    disabled={isRevoking}
                                >
                                    {copy.revoke}
                                </Button>
                                <Button onClick={openConsent} disabled={isConsentStale}>
                                    {copy.regenerate}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </Card>
            )}

            <McpConsentDialog
                open={isConsentOpen}
                onOpenChange={(open) => (open ? openConsent() : closeConsent())}
                onConfirm={() => void confirmConsent()}
                isSubmitting={isGenerating}
                isConsentStale={isConsentStale}
            />

            <McpKeyRevealDialog
                keyValue={issuedKey}
                expiresAt={issuedExpiresAt}
                onDone={dismissIssuedKey}
            />

            <ConfirmDialog
                open={isRevokeOpen}
                onOpenChange={(open) => (open ? openRevoke() : closeRevoke())}
                title={copy.revokeTitle}
                description={copy.revokeDescription}
                confirmText={copy.revokeConfirm}
                danger
                isLoading={isRevoking}
                onConfirm={() => void confirmRevoke()}
            />
        </div>
    );
};

export default McpKeySection;
