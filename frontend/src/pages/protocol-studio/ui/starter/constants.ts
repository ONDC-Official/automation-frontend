import type { IStudioStarterFormValues } from "@pages/protocol-studio/ui/starter/types";

export type StudioStarterModalKey = "flowConverter" | "schemaGenerator";

export const STUDIO_STARTER_FORM_DEFAULTS: IStudioStarterFormValues = {
    domain: "",
    version: "",
    useCaseId: "",
    description: "",
};
