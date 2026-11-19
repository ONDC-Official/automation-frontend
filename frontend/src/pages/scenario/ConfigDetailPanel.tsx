import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Globe, Play } from "lucide-react";
import Alert from "@components/Shadcn/Alert";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import { ComboBox } from "@components/Shadcn/ComboBox";
import { TextField } from "@components/Shadcn/TextField";
import { ROUTES } from "@constants/routes";
import { useAuth } from "@hooks/useAuth";
import { OrganisationField, useOrganisationOptions } from "@pages/scenario/OrganisationField";
import { getScenarioDomainLabel } from "@pages/scenario/constants";
import { versionLabel } from "@pages/scenario/helpers";
import {
    IConfigDetailPanelProps,
    IConfigField,
    IDomainVersionWithUsecase,
    IScenarioFormData,
} from "@pages/scenario/types";

const ROLE_OPTIONS = [
    { label: "Buyer App (BAP)", value: "BAP" },
    { label: "Seller App (BPP)", value: "BPP" },
];
const roleLabel = (value: string) => ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** A detail that is already known: shown as plain text, not as an input. */
const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
    <div data-testid="locked-row" className="flex min-w-0 flex-col gap-1">
        <span className="text-body-2 text-text-secondary">{label}</span>
        <span className="break-words text-body-1 font-semibold text-text-primary">{value}</span>
    </div>
);

/**
 * Right side of the split view: the picked config. Known details are read-only;
 * anything missing (or not supported by Workbench) is asked for right here, for
 * this launch only. Nothing is saved or fetched: Launch creates the session the
 * same way the form does, and View report opens the existing reports page.
 */
export const ConfigDetailPanel = ({
    item,
    domains,
    isSubmitting,
    onLaunch,
    onBack,
}: IConfigDetailPanelProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const orgOptions = useOrganisationOptions();
    // The organisation is fixed when the config's own one is the user's, or when the
    // user has only one (asking would offer a single choice). Otherwise they pick.
    const isConfigOrgMine =
        !!item.data.orgId && orgOptions.some((o) => o.value === item.data.orgId);
    const lockedOrgId = isConfigOrgMine
        ? item.data.orgId
        : orgOptions.length === 1
          ? orgOptions[0].value
          : "";
    const isOrgLocked = !!lockedOrgId;
    const lockedOrgLabel = orgOptions.find((o) => o.value === lockedOrgId)?.label ?? "";
    const needsOrgPick = orgOptions.length > 1 && !isOrgLocked;
    const hasInputs = item.missingFields.length > 0 || needsOrgPick;
    const isMissing = (field: IConfigField) => item.missingFields.includes(field);

    // Missing fields start empty, so an unsupported value is never pre-picked.
    const initialValues = useMemo<IScenarioFormData>(() => {
        const values: IScenarioFormData = {
            ...item.data,
            env: item.data.env || "PRE-PRODUCTION",
            orgId: lockedOrgId,
        };
        item.missingFields.forEach((field) => {
            values[field] = "";
        });
        return values;
    }, [item, lockedOrgId]);

    const { control, handleSubmit, watch, setValue } = useForm<IScenarioFormData>({
        defaultValues: initialValues,
        mode: "onBlur",
    });
    const values = watch();

    const versionOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === values.domain);
        return (
            (domain?.version as IDomainVersionWithUsecase[] | undefined)?.map((v) => v.key) ?? []
        );
    }, [domains, values.domain]);

    const usecaseOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === values.domain);
        const versions = (domain?.version as IDomainVersionWithUsecase[] | undefined) ?? [];
        return versions.find((v) => v.key === values.version)?.usecase ?? [];
    }, [domains, values.domain, values.version]);

    // Ready once every missing detail (and the organisation, if one must be picked) is filled.
    const stillMissing = [
        ...item.missingFields.filter((field) => !values[field]),
        ...(needsOrgPick && !values.orgId ? ["orgId"] : []),
    ];
    const isReady = stillMissing.length === 0;

    const domainLabel = values.domain ? getScenarioDomainLabel(values.domain) : "";
    const title =
        item.name ||
        `${domainLabel || getScenarioDomainLabel(item.data.domain) || "Config"}${
            values.version || item.data.version
                ? ` · ${versionLabel(values.version || item.data.version)}`
                : ""
        }`;

    const onSubmit = async (formValues: IScenarioFormData) => {
        await onLaunch({
            ...initialValues,
            ...formValues,
            orgId: (isOrgLocked ? lockedOrgId : formValues.orgId) || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="flex flex-col gap-4 border-b border-n-30 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between dark:border-border-default">
                <div className="min-w-0 space-y-2">
                    {onBack ? (
                        <Button
                            type="button"
                            variant="link"
                            className="h-auto gap-1 px-0 lg:hidden"
                            onClick={onBack}
                        >
                            <ChevronLeft className="size-4" aria-hidden="true" />
                            All configs
                        </Button>
                    ) : null}
                    {item.data.subscriberUrl ? (
                        <p className="flex min-w-0 items-center gap-2 text-caption-1 text-text-secondary">
                            <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate" title={item.data.subscriberUrl}>
                                {item.data.subscriberUrl}
                            </span>
                        </p>
                    ) : null}
                    <h2 className="break-words text-h6 font-bold text-text-primary">{title}</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {values.npType ? (
                            <Badge variant="outline">{roleLabel(values.npType)}</Badge>
                        ) : null}
                        {domainLabel ? <Badge variant="outline">{domainLabel}</Badge> : null}
                        {values.usecaseId ? (
                            <Badge variant="outline">{values.usecaseId}</Badge>
                        ) : null}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="h-11 gap-2"
                        disabled={isSubmitting || !isReady}
                    >
                        <Play className="size-4" aria-hidden="true" />
                        {isSubmitting ? "Launching..." : "Launch"}
                    </Button>
                    {user ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-11 gap-2"
                            onClick={() => navigate(ROUTES.PROFILE_HISTORY)}
                        >
                            <FileText className="size-4" aria-hidden="true" />
                            View report
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
                {isReady ? (
                    <Alert
                        variant="success"
                        className="py-2 dark:border-success-800 dark:bg-success-800/30 dark:text-success-200"
                        message="Ready to launch"
                        description="Everything needed for this scenario is filled in."
                    />
                ) : (
                    <Alert
                        variant="warning"
                        className="py-2 dark:border-alert-800 dark:bg-alert-800/30 dark:text-alert-200"
                        message={`${stillMissing.length} ${stillMissing.length === 1 ? "detail" : "details"} to fill before launch`}
                    />
                )}

                <div className="space-y-4">
                    <h3 className="text-body-1 font-bold text-text-primary">Config details</h3>
                    {/* Only what the config already gives, two per row. */}
                    <div className="grid items-start gap-x-6 gap-y-5 sm:grid-cols-2">
                        {isOrgLocked ? (
                            <ReadOnlyField label="Organisation" value={lockedOrgLabel} />
                        ) : null}
                        {isMissing("npType") ? null : (
                            <ReadOnlyField label="App type" value={roleLabel(item.data.npType)} />
                        )}
                        {isMissing("subscriberUrl") ? null : (
                            <ReadOnlyField label="Subscriber URL" value={item.data.subscriberUrl} />
                        )}
                        {isMissing("domain") ? null : (
                            <ReadOnlyField
                                label="Domain"
                                value={getScenarioDomainLabel(item.data.domain)}
                            />
                        )}
                        {isMissing("version") ? null : (
                            <ReadOnlyField label="Version" value={item.data.version} />
                        )}
                        {isMissing("usecaseId") ? null : (
                            <ReadOnlyField label="Use case" value={item.data.usecaseId} />
                        )}
                    </div>
                </div>

                {hasInputs ? (
                    <div
                        data-testid="fill-in-section"
                        className="space-y-4 border-t border-n-30 pt-5 dark:border-border-default"
                    >
                        <h3 className="text-body-1 font-bold text-text-primary">
                            Fill in to launch
                        </h3>
                        {/* Only what the config is missing; an odd last field spans the row. */}
                        <div className="grid items-start gap-x-6 gap-y-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 [&_[data-slot=input-group]]:h-11 [&_[data-slot=input]]:h-11">
                            {needsOrgPick ? (
                                <OrganisationField control={control} name="orgId" />
                            ) : null}
                            {isMissing("npType") ? (
                                <ComboBox
                                    control={control}
                                    name="npType"
                                    label="App type"
                                    options={ROLE_OPTIONS}
                                    placeholder="Select app type"
                                    required
                                />
                            ) : null}
                            {isMissing("subscriberUrl") ? (
                                <TextField
                                    control={control}
                                    name="subscriberUrl"
                                    label="Subscriber URL"
                                    required
                                    placeholder="https://example.com"
                                    rules={{
                                        pattern: {
                                            value: /^https?:\/\/.+/i,
                                            message: "URL must start with http:// or https://",
                                        },
                                    }}
                                />
                            ) : null}
                            {isMissing("domain") ? (
                                <ComboBox
                                    control={control}
                                    name="domain"
                                    label="Domain"
                                    options={domains.map((d) => ({
                                        value: d.key,
                                        label: getScenarioDomainLabel(d.key),
                                    }))}
                                    placeholder="Select domain"
                                    required
                                    onValueChange={() => {
                                        setValue("version", "");
                                        setValue("usecaseId", "");
                                    }}
                                />
                            ) : null}
                            {isMissing("version") ? (
                                <ComboBox
                                    control={control}
                                    name="version"
                                    label="Version"
                                    options={versionOptions}
                                    placeholder="Select version"
                                    required
                                    disabled={!values.domain}
                                    onValueChange={() => setValue("usecaseId", "")}
                                />
                            ) : null}
                            {isMissing("usecaseId") ? (
                                <ComboBox
                                    control={control}
                                    name="usecaseId"
                                    label="Use case"
                                    options={usecaseOptions}
                                    placeholder="Select use case"
                                    required
                                    disabled={!values.version}
                                />
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </form>
    );
};
