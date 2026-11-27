import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Globe, Play } from "lucide-react";
import Alert from "@components/Shadcn/Alert";
import { Button } from "@components/Shadcn/Button";
import { ComboBox } from "@components/Shadcn/ComboBox";
import { TextField } from "@components/Shadcn/TextField";
import { ROUTES } from "@constants/routes";
import { useAuth } from "@hooks/useAuth";
import { OrganisationField, useOrganisationOptions } from "@pages/scenario/OrganisationField";
import { FIELD_TOOLTIPS } from "@pages/scenario/fieldTooltips";
import { getScenarioDomainLabel } from "@pages/scenario/constants";
import {
    IConfigDetailPanelProps,
    IConfigField,
    IDomainVersionWithUsecase,
    IScenarioFormData,
} from "@pages/scenario/types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setConfigFillDraft, type ScenarioFormDraft } from "@store/slices/scenarioDraftSlice";

const ROLE_OPTIONS = [
    { label: "Buyer App", value: "BAP" },
    { label: "Seller App", value: "BPP" },
];
const roleLabel = (value: string) => ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** One read-only fact in the detail header: the value on top, its label beneath. */
const HeaderFact = ({
    label,
    value,
    icon: Icon,
    withDivider,
}: {
    label: string;
    value: string;
    icon?: typeof Globe;
    withDivider: boolean;
}) => (
    <div
        data-testid="locked-row"
        className={
            "flex min-w-0 max-w-[16rem] flex-col gap-0.5" +
            (withDivider ? " border-l border-n-30 pl-5 dark:border-border-default" : "")
        }
    >
        <span className="flex min-w-0 items-center gap-1.5 text-body-1 font-semibold text-text-primary">
            {Icon ? (
                <Icon className="size-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
            ) : null}
            <span className="truncate" title={value}>
                {value}
            </span>
        </span>
        <span className="text-caption-1 text-text-secondary">{label}</span>
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
    const needsOrgPick = orgOptions.length > 1 && !isOrgLocked;
    const isMissing = (field: IConfigField) => item.missingFields.includes(field);

    const dispatch = useAppDispatch();
    const persistedFill = useAppSelector((s) => s.scenarioDraft.fillByConfig[item.id]);

    // Version and use case are always inputs now, so pre-fill them from the config's
    // own values when those are actually in Workbench's list (saved configs); NP Portal
    // configs come blank. A saved draft (from a refresh) always wins. Other missing
    // fields start empty so an unsupported value is never pre-picked.
    const initialValues = useMemo<IScenarioFormData>(() => {
        const draft: ScenarioFormDraft = persistedFill ?? {};
        const hasDraft = !!persistedFill;
        const fromDraft = (field: keyof IScenarioFormData) =>
            typeof draft[field] === "string" ? draft[field] : "";

        const domainEntry = domains.find((d) => d.key === item.data.domain);
        const domainVersions =
            (domainEntry?.version as IDomainVersionWithUsecase[] | undefined) ?? [];
        const validVersion = domainVersions.some((v) => v.key === item.data.version)
            ? (item.data.version ?? "")
            : "";
        const validUsecase = domainVersions
            .find((v) => v.key === validVersion)
            ?.usecase?.includes(item.data.usecaseId ?? "")
            ? (item.data.usecaseId ?? "")
            : "";

        const values: IScenarioFormData = {
            ...item.data,
            env: item.data.env || "PRE-PRODUCTION",
            orgId: isOrgLocked ? lockedOrgId : fromDraft("orgId"),
            version: hasDraft ? fromDraft("version") : validVersion,
            usecaseId: hasDraft ? fromDraft("usecaseId") : validUsecase,
        };
        // Any other unsupported/empty detail (domain, app type, URL) starts blank.
        item.missingFields.forEach((field) => {
            if (field === "version" || field === "usecaseId") return;
            values[field] = hasDraft ? fromDraft(field) : "";
        });
        return values;
    }, [item, domains, lockedOrgId, isOrgLocked, persistedFill]);

    const { control, handleSubmit, watch, setValue } = useForm<IScenarioFormData>({
        defaultValues: initialValues,
        mode: "onBlur",
    });
    const values = watch();

    // Save every change so a refresh keeps what was typed here (persisted, no backend).
    useEffect(() => {
        const sub = watch((v) =>
            dispatch(
                setConfigFillDraft({ configId: item.id, values: v as unknown as ScenarioFormDraft })
            )
        );
        return () => sub.unsubscribe();
    }, [watch, item.id, dispatch]);

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

    // A required dropdown with exactly one choice is filled in and locked
    // (shown prefilled, can't be opened or changed, no dropdown arrow).
    useEffect(() => {
        if (versionOptions.length === 1 && !values.version) {
            setValue("version", versionOptions[0], { shouldValidate: true });
        }
    }, [versionOptions, values.version, setValue]);
    useEffect(() => {
        if (usecaseOptions.length === 1 && !values.usecaseId) {
            setValue("usecaseId", usecaseOptions[0], { shouldValidate: true });
        }
    }, [usecaseOptions, values.usecaseId, setValue]);

    // Version and use case must always be chosen; add any other detail the config is
    // missing, plus the organisation when one has to be picked.
    const requiredFields = Array.from(
        new Set<IConfigField>([...item.missingFields, "version", "usecaseId"])
    );
    const stillMissing = [
        ...requiredFields.filter((field) => !values[field]),
        ...(needsOrgPick && !values.orgId ? ["orgId"] : []),
    ];
    const isReady = stillMissing.length === 0;

    // Title: friendly domain label (which already carries the short code), no version.
    const title = getScenarioDomainLabel(values.domain || item.data.domain) || "Config";
    // The exact ONDC domain code, shown next to the friendly title.
    const domainCode = values.domain || item.data.domain;

    // Read-only facts shown under the title: subscriber URL and role (the organisation
    // is already chosen in the top bar, so it isn't repeated here).
    const headerFacts = [
        !isMissing("subscriberUrl") && item.data.subscriberUrl
            ? { label: "Subscriber URL", value: item.data.subscriberUrl, icon: Globe }
            : null,
        !isMissing("npType") && item.data.npType
            ? { label: "Role", value: roleLabel(item.data.npType) }
            : null,
    ].filter(Boolean) as { label: string; value: string; icon?: typeof Globe }[];

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
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h2 className="break-words text-h6 font-bold text-text-primary">{title}</h2>
                        {domainCode ? (
                            <span className="text-body-2 font-semibold text-text-secondary">
                                {domainCode}
                            </span>
                        ) : null}
                    </div>
                    {headerFacts.length > 0 ? (
                        <div className="flex flex-wrap items-start gap-x-9 gap-y-2 pt-4">
                            {headerFacts.map((fact, i) => (
                                <HeaderFact
                                    key={fact.label}
                                    label={fact.label}
                                    value={fact.value}
                                    icon={fact.icon}
                                    withDivider={i > 0}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
                {user ? (
                    <div className="flex shrink-0 flex-wrap gap-3">
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
                    </div>
                ) : null}
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

                {/* Version and use case are always asked for here; any detail the config
                    is missing (org, app type, URL, domain) is added only when needed. An
                    odd last field spans the full row. */}
                <div
                    data-testid="fill-in-section"
                    className="grid items-start gap-x-6 gap-y-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2"
                >
                    {needsOrgPick ? <OrganisationField control={control} name="orgId" /> : null}
                    {isMissing("npType") ? (
                        <ComboBox
                            control={control}
                            name="npType"
                            label="App type"
                            floatingLabel
                            tooltip={FIELD_TOOLTIPS.role}
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
                            floatingLabel
                            tooltip={FIELD_TOOLTIPS.subscriberUrl}
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
                            floatingLabel
                            tooltip={FIELD_TOOLTIPS.domain}
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
                    <ComboBox
                        control={control}
                        name="version"
                        label="Version"
                        floatingLabel
                        tooltip={FIELD_TOOLTIPS.version}
                        options={versionOptions}
                        placeholder="Select version"
                        required
                        disabled={!values.domain || versionOptions.length === 1}
                        onValueChange={() => setValue("usecaseId", "")}
                    />
                    <ComboBox
                        control={control}
                        name="usecaseId"
                        label="Use case"
                        floatingLabel
                        tooltip={FIELD_TOOLTIPS.usecase}
                        options={usecaseOptions}
                        placeholder="Select use case"
                        required
                        disabled={!values.version || usecaseOptions.length === 1}
                    />
                </div>
            </div>

            <div className="flex justify-end px-5 pb-5 pt-1 sm:px-6">
                <Button
                    type="submit"
                    size="lg"
                    className="h-11 gap-2"
                    disabled={isSubmitting || !isReady}
                >
                    <Play className="size-4" aria-hidden="true" />
                    {isSubmitting ? "Launching..." : "Launch"}
                </Button>
            </div>
        </form>
    );
};
