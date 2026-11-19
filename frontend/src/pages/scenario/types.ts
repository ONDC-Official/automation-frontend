import { ReactNode } from "react";
import {
    Control,
    FieldErrors,
    FieldValues,
    UseFormHandleSubmit,
    UseFormRegister,
    UseFormWatch,
} from "react-hook-form";
import { IDomain, IDomainVersion } from "@pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";

export type INewSessionFormValues = IScenarioFormData & {
    config?: string;
};

export type INewSessionFormProps = {
    domains: IDomain[];
    savedPreferences?: Record<string, IScenarioFormData>;
    initialSavedConfigKey?: string;
    isSubmitting?: boolean;
    onSubmit: (data: IScenarioFormData) => Promise<void>;
    /** Called after Cancel clears the form (e.g. to leave "continue without login"). */
    onCancel?: () => void;
};

export type ISavedConfigPanelProps = {
    savedConfigKeys: string[];
    selectedSavedConfigKey: string;
    selectedSavedConfig?: IScenarioFormData;
    savedUsecaseId: string;
    savedConfigUsecaseOptions: string[];
    savedOrgId: string;
    isSavedOrgLocked: boolean;
    isSubmitting: boolean;
    onConfigKeyChange: (key: string) => void;
    onUsecaseChange: (usecaseId: string) => void;
    onOrgChange: (orgId: string) => void;
    onSubmit: () => void;
    onFillManually: () => void;
};

export type IManualSessionFormProps = {
    domains: IDomain[];
    hasSavedPrefs: boolean;
    isLoggedIn: boolean;
    isSubmitting: boolean;
    control: Control<INewSessionFormValues>;
    register: UseFormRegister<INewSessionFormValues>;
    errors: FieldErrors<INewSessionFormValues>;
    handleSubmit: UseFormHandleSubmit<INewSessionFormValues>;
    watch: UseFormWatch<INewSessionFormValues>;
    versionOptions: string[];
    usecaseOptions: string[];
    // configOptions: string[];
    onFormSubmit: (data: INewSessionFormValues) => Promise<void>;
    onBackToSavedConfigs: () => void;
    onDomainChange: (domain: string) => void;
    onVersionChange: (version: string) => void;
    onConfigChange: (config: string) => void;
    onCancel: () => void;
};

export type IDomainVersionWithUsecase = IDomainVersion & {
    usecase: string[];
};

export interface IScenarioFormData {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: string;
    env: string;
    /** NP Portal organisation the session is for; only set for ONDC logins. */
    orgId?: string;
}

export interface ISessionResponse {
    sessionId: string;
    flowConfigs?: Record<string, Flow>;
    subscriberUrl: string;
    activeStep: number;
}

export type ISavedPrefAPI = {
    subscriber_url: string;
    domain: string;
    version: string;
    usecase_id: string;
    np_type: string;
    env: string;
    org_id?: string;
};

export type ILocalSessionHistoryCardProps = {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    onOpen: () => void;
};

export type IPreviousSessionItem = {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    timestamp: string;
    expiresAt: string;
};

export type IPreviousSessionsPanelProps = {
    sessions: IPreviousSessionItem[];
    onOpenSession: (session: IPreviousSessionItem) => void;
    onSessionsChange?: (sessions: IPreviousSessionItem[]) => void;
};

export type ILocationSessionHistoryProps = {
    sessions: IPreviousSessionItem[];
    onOpenSession: (session: IPreviousSessionItem) => void;
    onSessionsChange?: (sessions: IPreviousSessionItem[]) => void;
    sessionsPerPage?: number;
};

export type IDomainVersionUsecaseFields = Pick<
    IScenarioFormData,
    "domain" | "version" | "usecaseId"
> &
    FieldValues;

export type IDomainVersionUsecaseFieldsProps<
    T extends IDomainVersionUsecaseFields = INewSessionFormValues,
> = {
    control: Control<T>;
    versionOptions: string[];
    usecaseOptions: string[];
    watchedDomain: string;
    watchedVersion: string;
    onDomainChange?: (domain: string) => void;
    onVersionChange: (version: string) => void;
    domainOptions?: ComboBoxOptionInput[];
};

export type ISessionFormActionsProps = {
    isSubmitting: boolean;
    submitType?: "submit" | "button";
    submitDisabled?: boolean;
    onSubmit?: () => void;
    extraActions?: ReactNode;
    className?: string;
    /** Shows a Cancel button left of Submit. */
    onCancel?: () => void;
};

/** One config as NP Portal sends it. Any field may be missing. */
export type INpPortalConfig = {
    subscriber_url?: string;
    np_type?: string;
    domain?: string;
    version?: string;
    usecase?: string;
    /** The organisation this config belongs to. */
    org_id?: string;
};

/** Where a config card came from. */
export type IConfigSource = "np_portal" | "saved";

/** The config fields that can be missing (or not supported by Workbench). */
export type IConfigField = "subscriberUrl" | "npType" | "domain" | "version" | "usecaseId";

/** One card in the "Your configs" list. */
export type IConfigCardItem = {
    /** Unique per config: source + organisation + all 5 fields (or the saved config's name). */
    id: string;
    source: IConfigSource;
    /** The saved config's name; only for saved configs. */
    name?: string;
    data: IScenarioFormData;
    /** Fields the user still has to fill before Launch. */
    missingFields: IConfigField[];
};

/** The cards that share one subscriber URL. */
export type IConfigGroup = {
    subscriberUrl: string;
    items: IConfigCardItem[];
};

/** Which app type the config list shows. */
export type IConfigRoleFilter = "all" | "BAP" | "BPP";

export type IConfigListProps = {
    items: IConfigCardItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNewSession: () => void;
    /**
     * Organisation names by ID. Pass it only when the user has more than one
     * organisation: each row then names its organisation, so the same config from
     * two organisations doesn't look like a repeat.
     */
    organisationNames?: Record<string, string>;
};

export type IConfigDetailPanelProps = {
    item: IConfigCardItem;
    domains: IDomain[];
    isSubmitting: boolean;
    onLaunch: (data: IScenarioFormData) => Promise<void>;
    /** Small screens only: go back to the config list. */
    onBack?: () => void;
};
