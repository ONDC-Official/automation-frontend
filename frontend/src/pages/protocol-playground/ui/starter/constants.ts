import type { StarterTabKey } from "@pages/protocol-playground/ui/starter/types";

export type StarterModalKey = "savedConfigs" | "gitHubImport" | "flowConverter" | "schemaGenerator";

export const STARTER_TABS: { key: StarterTabKey; label: string }[] = [
    { key: "tools", label: "Tools" },
    { key: "flow-converter", label: "Flow Converter" },
    { key: "schema-generator", label: "Schema Generator" },
];

export const STARTER_FORM_DEFAULTS = {
    domain: "",
    version: "",
    flowId: "",
    useCaseId: "",
    description: "",
};
