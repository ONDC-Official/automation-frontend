import type { Control } from "react-hook-form";

export interface IScenarioVersionItem {
    key: string;
}

export interface IScenarioDomainItem {
    key: string;
    version?: IScenarioVersionItem[];
}

export interface IStarterFormValues {
    domain: string;
    version: string;
    flowId: string;
    useCaseId: string;
    description: string;
}

export type StarterTabKey = "tools" | "flow-converter" | "schema-generator";

export interface IFlowFieldsProps {
    control: Control<IStarterFormValues>;
    domainOptions: string[];
    versionOptions: string[];
    onDomainChange: () => void;
}
