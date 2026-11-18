import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";
import type { Control } from "react-hook-form";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

import type { StudioProjectContent } from "@pages/protocol-studio/persistence/project-file";

/** v1's starter form values without `flowId` — a Studio config covers every flow. */
export interface IStudioStarterFormValues {
    domain: string;
    version: string;
    useCaseId: string;
    description: string;
}

export interface IStudioStarterScreenProps {
    onCreate: (config: MockPlaygroundConfigV2Type) => void;
    /** The local draft, when one is saved: shown as a "Resume" option. */
    draft?: { config: MockPlaygroundConfigV2Type; savedAt: string } | null;
    onResume?: () => void;
    /** Opens a downloaded project file: it becomes the draft, and is resumed. */
    onOpenProject?: (project: StudioProjectContent) => void;
}

export interface IStudioFlowFieldsProps {
    control: Control<IStudioStarterFormValues>;
    domainOptions: ComboBoxOptionInput[];
    versionOptions: string[];
    onDomainChange: () => void;
}
