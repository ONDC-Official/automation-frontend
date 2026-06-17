import { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthContext } from "@/context/authContext";
import { DEFAULT_VALUES } from "@/pages/scenario/constants";
import {
    IDomainVersionWithUsecase,
    INewSessionFormProps,
    INewSessionFormValues,
} from "@/pages/scenario/types";
import { trackSchemaValidationForm } from "@/pages/scenario/helpers";

export function useNewSessionForm({
    domains,
    savedPreferences = {},
    initialSavedConfigKey = "",
    onSubmit,
}: INewSessionFormProps) {
    const { user } = useContext(AuthContext);

    const savedConfigKeys = Object.keys(savedPreferences);
    const hasSavedPrefs = savedConfigKeys.length > 0;

    const [showManualForm, setShowManualForm] = useState(!hasSavedPrefs);
    const [selectedSavedConfigKey, setSelectedSavedConfigKey] = useState(initialSavedConfigKey);
    const [savedUsecaseId, setSavedUsecaseId] = useState(
        initialSavedConfigKey ? (savedPreferences[initialSavedConfigKey]?.usecaseId ?? "") : ""
    );

    const isLoggedIn = !!user?.githubId;

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<INewSessionFormValues>({ defaultValues: DEFAULT_VALUES });

    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

    const versionOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === watchedDomain);
        return (
            (domain?.version as IDomainVersionWithUsecase[] | undefined)?.map((v) => v.key) ?? []
        );
    }, [domains, watchedDomain]);

    const usecaseOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === watchedDomain);
        const versions = (domain?.version as IDomainVersionWithUsecase[] | undefined) ?? [];
        const version = versions.find((v) => v.key === watchedVersion);
        return version?.usecase ?? [];
    }, [domains, watchedDomain, watchedVersion]);

    // const configOptions = useMemo(
    //     () =>
    //         subscriberData?.mappings?.map(
    //             (mapping) => `${mapping.domain} - ${mapping.type} - ${mapping.uri}`
    //         ) ?? [],
    //     [subscriberData]
    // );

    useEffect(() => {
        if (initialSavedConfigKey && savedPreferences[initialSavedConfigKey]) {
            setSelectedSavedConfigKey(initialSavedConfigKey);
            setSavedUsecaseId(savedPreferences[initialSavedConfigKey].usecaseId ?? "");
            setShowManualForm(false);
        }
    }, [initialSavedConfigKey, savedPreferences]);

    const handleDomainChange = (domain: string) => {
        setValue("version", "");
        setValue("usecaseId", "");
        trackSchemaValidationForm("Added domain", domain);
    };

    const handleVersionChange = (version: string) => {
        setValue("usecaseId", "");
        trackSchemaValidationForm("Added version", version);
    };

    const handleConfigChange = (config: string) => {
        const [domain] = config.split(" - ");
        setValue("domain", domain);
        setValue("version", "");
        setValue("usecaseId", "");
    };

    const handleFormSubmit = async (data: INewSessionFormValues) => {
        if (isLoggedIn && data.config) {
            const [domain, type, uri] = data.config.split(" - ");
            await onSubmit({
                domain,
                npType: type,
                subscriberUrl: uri,
                version: data.version,
                usecaseId: data.usecaseId,
                env: "LOGGED-IN",
            });
            return;
        }
        await onSubmit(data);
    };

    const handleSavedConfigSubmit = async () => {
        const cfg = savedPreferences[selectedSavedConfigKey];
        if (!cfg || !savedUsecaseId) return;
        await onSubmit({ ...cfg, usecaseId: savedUsecaseId });
    };

    const selectedSavedConfig = selectedSavedConfigKey
        ? savedPreferences[selectedSavedConfigKey]
        : undefined;

    const savedConfigUsecaseOptions = useMemo(() => {
        if (!selectedSavedConfig) return [];
        const domainData = domains.find((d) => d.key === selectedSavedConfig.domain);
        const versionData = (domainData?.version as IDomainVersionWithUsecase[] | undefined)?.find(
            (v) => v.key === selectedSavedConfig.version
        );
        return versionData?.usecase ?? [];
    }, [domains, selectedSavedConfig]);

    const handleConfigKeyChange = (key: string) => {
        setSelectedSavedConfigKey(key);
        setSavedUsecaseId(savedPreferences[key]?.usecaseId ?? "");
    };

    return {
        showSavedConfigView: hasSavedPrefs && !showManualForm,
        savedConfigProps: {
            savedConfigKeys,
            selectedSavedConfigKey,
            selectedSavedConfig,
            savedUsecaseId,
            savedConfigUsecaseOptions,
            onConfigKeyChange: handleConfigKeyChange,
            onUsecaseChange: setSavedUsecaseId,
            onSubmit: handleSavedConfigSubmit,
            onFillManually: () => setShowManualForm(true),
        },
        manualFormProps: {
            domains,
            hasSavedPrefs,
            isLoggedIn,
            control,
            register,
            errors,
            handleSubmit,
            watch,
            versionOptions,
            usecaseOptions,
            // configOptions,
            onFormSubmit: handleFormSubmit,
            onBackToSavedConfigs: () => setShowManualForm(false),
            onDomainChange: handleDomainChange,
            onVersionChange: handleVersionChange,
            onConfigChange: handleConfigChange,
        },
    };
}
