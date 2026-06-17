import type { Control } from "react-hook-form";

export interface IScenarioUsecaseItem {
    key: string;
}

export interface IScenarioVersionItem {
    key: string;
    usecase?: IScenarioUsecaseItem[];
}

export interface IScenarioDomainItem {
    key: string;
    version?: IScenarioVersionItem[];
}

export interface IStarterFormValues {
    domain: string;
    version: string;
    flowId: string;
    usecase: string;
    useCaseId: string;
    description: string;
}

export type StarterTabKey = "tools" | "flow-converter" | "schema-generator";

export interface IFlowFieldsProps {
    control: Control<IStarterFormValues>;
    domainOptions: string[];
    versionOptions: string[];
    usecaseOptions: string[];
    onDomainChange: () => void;
    onVersionChange: () => void;
}
