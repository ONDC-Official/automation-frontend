import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { createInitialMockConfig } from "@ondc/automation-mock-runner";
import { ArrowRightIcon, FolderOpenIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/Shadcn/Tabs/tabs";
import GitHubIcon from "@/assets/svgs/GitHubIcon";
import { cn } from "@/lib/utils";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { GitHubImportModal } from "@pages/protocol-playground/ui/github-import-modal";
import { SavedConfigsModal } from "@pages/protocol-playground/ui/saved-configs-modal";
import { FlowConverterModal } from "@pages/protocol-playground/ui/components/flow-converter";
import { SchemaGeneratorModal } from "@pages/protocol-playground/ui/components/schema-generator";
import { FlowFields } from "@pages/protocol-playground/ui/starter/flow-fields";
import { useScenarioFormData } from "@pages/protocol-playground/ui/starter/use-scenario-form-data";
import { STARTER_FORM_DEFAULTS, STARTER_TABS, type StarterModalKey } from "@pages/protocol-playground/ui/starter/constants";
import type {
    IStarterFormValues,
    StarterTabKey,
} from "@pages/protocol-playground/ui/starter/types";

export const StarterScreen = () => {
    const { setCurrentConfig } = useContext(PlaygroundContext);
    const { control, handleSubmit, watch, setValue } = useForm<IStarterFormValues>({
        defaultValues: STARTER_FORM_DEFAULTS,
        mode: "onChange",
    });

    const domain = watch("domain");
    const version = watch("version");
    const flowId = watch("flowId");

    const { domainOptions, versionOptions, usecaseOptions } = useScenarioFormData(domain, version);

    const [activeModal, setActiveModal] = useState<StarterModalKey | null>(null);

    const canContinue = !!domain && !!version && !!flowId;
    const closeModal = () => setActiveModal(null);

    const onSubmit = ({
        domain,
        version,
        flowId,
        usecase,
        useCaseId,
        description,
    }: IStarterFormValues) => {
        if (!domain || !version || !flowId) return;
        const initial = createInitialMockConfig(domain, version, flowId);
        const resolvedUseCaseId = useCaseId.trim() || usecase.trim();
        if (resolvedUseCaseId) initial.meta.use_case_id = resolvedUseCaseId;
        if (description.trim()) initial.meta.description = description.trim();
        setCurrentConfig(initial);
    };

    const handleTabChange = (value: string) => {
        if (value === ("flow-converter" satisfies StarterTabKey)) {
            setActiveModal("flowConverter");
        } else if (value === ("schema-generator" satisfies StarterTabKey)) {
            setActiveModal("schemaGenerator");
        }
    };

    return (
        <div className="flex min-h-full w-full justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <div className="rounded-2xl border border-n-30 bg-surface-elevated px-6 py-7 shadow-sm dark:border-border-default sm:px-8">
                    <header className="flex flex-col gap-1">
                        <h1 className="text-h4 font-bold text-text-primary">
                            ONDC Protocol Playground
                        </h1>
                        <p className="text-body-2 text-text-secondary">
                            Configure and test your protocol flows
                        </p>
                    </header>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button type="button" onClick={() => setActiveModal("savedConfigs")}>
                            <FolderOpenIcon className="size-4" />
                            Load Saved
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveModal("gitHubImport")}
                            className="border-n-900 bg-n-900 text-n-0 hover:bg-n-600 hover:text-n-0 dark:border-n-0 dark:bg-n-0 dark:text-neutral-900 dark:hover:bg-n-30 dark:hover:text-neutral-900"
                        >
                            <GitHubIcon className="size-5" />
                            Import from GitHub
                        </Button>
                    </div>

                    <Tabs value="tools" onValueChange={handleTabChange} className="mt-6 gap-0">
                        <TabsList variant="line">
                            {STARTER_TABS.map((tab) => (
                                <TabsTrigger key={tab.key} value={tab.key}>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
                        <FlowFields
                            control={control}
                            domainOptions={domainOptions}
                            versionOptions={versionOptions}
                            usecaseOptions={usecaseOptions}
                            onDomainChange={() => {
                                setValue("version", "");
                                setValue("usecase", "");
                            }}
                            onVersionChange={() => setValue("usecase", "")}
                        />

                        <Button
                            type="submit"
                            size="lg"
                            disabled={!canContinue}
                            className={cn("w-fit rounded-xl")}
                        >
                            Continue to Playground
                            <ArrowRightIcon className="size-4" />
                        </Button>
                    </form>
                </div>
            </div>

            <SavedConfigsModal
                isOpen={activeModal === "savedConfigs"}
                onClose={closeModal}
                onConfigSelected={(selectedDomain, selectedVersion, selectedFlowId) => {
                    setValue("domain", selectedDomain);
                    setValue("version", selectedVersion);
                    setValue("flowId", selectedFlowId);
                }}
            />

            <GitHubImportModal
                isOpen={activeModal === "gitHubImport"}
                defaultDomain={domain}
                onClose={closeModal}
                onImport={(config) => setCurrentConfig(config)}
            />

            <FlowConverterModal
                isOpen={activeModal === "flowConverter"}
                onClose={closeModal}
            />

            <SchemaGeneratorModal
                isOpen={activeModal === "schemaGenerator"}
                defaultDomain={domain}
                onClose={closeModal}
            />
        </div>
    );
};

export default StarterScreen;
