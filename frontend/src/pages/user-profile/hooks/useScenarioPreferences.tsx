import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Modal } from "antd";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { ROUTES } from "@constants/routes";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { IDomain } from "@pages/schema-validation/types";
import { useProfileShell } from "@pages/user-profile/ProfileShellContext";
import type {
    IDomainVersionWithUsecase,
    ScenarioPreferences,
    ScenarioPreferencesAPI,
} from "@pages/user-profile/types";

const EMPTY_PREFERENCES: ScenarioPreferences = {
    configName: "",
    subscriberUrl: "",
    domain: "",
    version: "",
    usecaseId: "",
    npType: "BAP",
    env: "PRE-PRODUCTION",
};

const toAPI = (p: ScenarioPreferences): ScenarioPreferencesAPI => ({
    subscriber_url: p.subscriberUrl,
    domain: p.domain,
    version: p.version,
    usecase_id: p.usecaseId,
    np_type: p.npType,
    env: p.env,
});

const fromAPI = (p: ScenarioPreferencesAPI, configName: string): ScenarioPreferences => ({
    configName,
    subscriberUrl: p.subscriber_url,
    domain: p.domain,
    version: p.version,
    usecaseId: p.usecase_id ?? "",
    npType: p.np_type,
    env: p.env,
});

export const useScenarioPreferences = () => {
    const navigate = useNavigate();
    const { setCounts } = useProfileShell();

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<ScenarioPreferences>({ defaultValues: EMPTY_PREFERENCES });

    const [domains, setDomains] = useState<IDomain[]>([]);
    const [savedPrefs, setSavedPrefs] = useState<Record<string, ScenarioPreferences>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const allDomainsRef = useRef<IDomain[]>([]);

    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

    const domainOptions = useMemo(() => domains.map((d) => d.key), [domains]);

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

    const updateConfigCount = useCallback(
        (prefs: Record<string, ScenarioPreferences>) => {
            setCounts((prev) => ({ ...prev, configs: Object.keys(prefs).length }));
        },
        [setCounts]
    );

    const fetchDomainData = useCallback(async () => {
        try {
            const response = await apiClient.get<{ domain: IDomain[] }>(
                API_ROUTES.CONFIG.SCENARIO_FORM_DATA
            );
            const fetchedDomains: IDomain[] = response.data.domain || [];
            allDomainsRef.current = fetchedDomains;
            setDomains(fetchedDomains);
        } catch (e) {
            console.error("Error fetching scenario form data", e);
        }
    }, []);

    const fetchSavedPreferences = useCallback(async () => {
        try {
            const response = await apiClient.get<Record<string, ScenarioPreferencesAPI>>(
                API_ROUTES.USER.SCENARIO_PREFERENCES
            );
            const raw = response.data;
            if (!raw) return;
            const mapped: Record<string, ScenarioPreferences> = {};
            Object.entries(raw).forEach(([key, val]) => {
                mapped[key] = fromAPI(val as ScenarioPreferencesAPI, key);
            });
            setSavedPrefs(mapped);
            updateConfigCount(mapped);
        } catch {
            // No saved preferences yet
        }
    }, [updateConfigCount]);

    useEffect(() => {
        Promise.all([fetchDomainData(), fetchSavedPreferences()]).finally(() =>
            setIsFetching(false)
        );
    }, [fetchDomainData, fetchSavedPreferences]);

    const handleDomainChange = () => {
        setValue("version", "");
        setValue("usecaseId", "");
    };

    const handleVersionChange = () => {
        setValue("usecaseId", "");
    };

    const handleEdit = (key: string) => {
        const config = savedPrefs[key];
        setEditingKey(key);
        reset({
            configName: key,
            subscriberUrl: config.subscriberUrl,
            domain: config.domain,
            version: config.version,
            usecaseId: config.usecaseId,
            npType: config.npType,
            env: config.env,
        });
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        reset(EMPTY_PREFERENCES);
    };

    const onSubmit = async (data: ScenarioPreferences) => {
        const { domain, version, usecaseId, npType, env } = data;
        if (!domain || !version || !usecaseId || !npType) {
            toast.error("Please select domain, version, use case and app type");
            return;
        }
        const configKey = editingKey ?? data.configName.trim();
        const payload = toAPI({
            configName: configKey,
            subscriberUrl: data.subscriberUrl,
            domain,
            version,
            usecaseId,
            npType,
            env,
        });

        setIsSaving(true);
        try {
            await apiClient.put(API_ROUTES.USER.SCENARIO_PREFERENCE_BY_KEY(configKey), payload);
            const nextPrefs = {
                ...savedPrefs,
                [configKey]: {
                    configName: configKey,
                    subscriberUrl: data.subscriberUrl,
                    domain,
                    version,
                    usecaseId,
                    npType,
                    env,
                },
            };
            setSavedPrefs(nextPrefs);
            updateConfigCount(nextPrefs);
            toast.success(editingKey ? "Configuration updated" : "Configuration saved");
            setEditingKey(null);
            reset(EMPTY_PREFERENCES);
        } catch (e) {
            console.error("Error saving preferences", e);
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (configKey: string) => {
        try {
            await apiClient.delete(API_ROUTES.USER.SCENARIO_PREFERENCE_BY_KEY(configKey));
            const nextPrefs = { ...savedPrefs };
            delete nextPrefs[configKey];
            setSavedPrefs(nextPrefs);
            updateConfigCount(nextPrefs);
            if (editingKey === configKey) handleCancelEdit();
            toast.success("Configuration deleted");
        } catch (e) {
            console.error("Error deleting preference", e);
            toast.error("Failed to delete configuration");
        }
    };

    const handleLaunch = (configKey: string) => {
        navigate(`${ROUTES.SCENARIO}?config=${encodeURIComponent(configKey)}`);
    };

    const confirmDelete = (configKey: string) => {
        Modal.confirm({
            title: "Delete configuration",
            icon: <ExclamationTriangleIcon className="size-5 text-error-500" />,
            content: (
                <span>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-text-primary">{configKey}</span>? This
                    action cannot be undone.
                </span>
            ),
            okText: "Delete",
            cancelText: "Cancel",
            centered: true,
            okButtonProps: {
                style: {
                    backgroundColor: "var(--color-error-500)",
                    borderColor: "var(--color-error-500)",
                    color: "#fff",
                },
            },
            onOk: () => handleDelete(configKey),
        });
    };

    return {
        control,
        register,
        errors,
        watch,
        setValue,
        handleSubmit,
        domainOptions,
        versionOptions,
        usecaseOptions,
        handleDomainChange,
        handleVersionChange,
        savedPrefs,
        isSaving,
        isFetching,
        editingKey,
        handleEdit,
        handleCancelEdit,
        onSubmit,
        confirmDelete,
        handleLaunch,
        allDomainsRef,
    };
};
