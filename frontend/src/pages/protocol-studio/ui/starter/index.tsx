import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import {
    createInitialMockConfigV2,
    type MockPlaygroundConfigV2Type,
} from "@ondc/automation-mock-runner";
import { ArrowRightIcon, ArrowUpTrayIcon, FolderOpenIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Button } from "@components/Shadcn/Button";
import { ConfirmDialog } from "@components/Shadcn/Dialog/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@components/Shadcn/Tabs/tabs";
import GitHubIcon from "@assets/svgs/GitHubIcon";
import { cn } from "@/lib/utils";
import { FlowConverterModal } from "@pages/protocol-playground/ui/components/flow-converter";
import { SchemaGeneratorModal } from "@pages/protocol-playground/ui/components/schema-generator";
import { useScenarioFormData } from "@pages/protocol-playground/ui/starter/use-scenario-form-data";
import { STARTER_TABS } from "@pages/protocol-playground/ui/starter/constants";
import type { StarterTabKey } from "@pages/protocol-playground/ui/starter/types";
import {
    readStudioProjectFile,
    type StudioProjectContent,
} from "@pages/protocol-studio/persistence/project-file";
import { StudioFlowFields } from "@pages/protocol-studio/ui/starter/fields";
import {
    STUDIO_STARTER_FORM_DEFAULTS,
    type StudioStarterModalKey,
} from "@pages/protocol-studio/ui/starter/constants";
import type {
    IStudioStarterFormValues,
    IStudioStarterScreenProps,
} from "@pages/protocol-studio/ui/starter/types";

// GitHub import is wired to v1 configs (flowId-keyed storage, v1 MockRunner
// validation); it lights up once Studio configs can be imported.
const COMING_SOON = "Coming soon to Protocol Studio";

/** What replaces the saved draft once the user confirms: a new config, or an opened project. */
type PendingReplace =
    | { kind: "create"; config: MockPlaygroundConfigV2Type }
    | { kind: "open"; project: StudioProjectContent };

export const StudioStarterScreen = ({
    onCreate,
    draft,
    onResume,
    onOpenProject,
}: IStudioStarterScreenProps) => {
    const { control, handleSubmit, watch, setValue } = useForm<IStudioStarterFormValues>({
        defaultValues: STUDIO_STARTER_FORM_DEFAULTS,
        mode: "onChange",
    });

    const domain = watch("domain");
    const version = watch("version");

    const { domainOptions, versionOptions } = useScenarioFormData(domain);

    const [activeModal, setActiveModal] = useState<StudioStarterModalKey | null>(null);

    const canContinue = !!domain && !!version;
    const closeModal = () => setActiveModal(null);

    // Continuing, or opening a project file, replaces the saved draft: ask first.
    const [pending, setPending] = useState<PendingReplace | null>(null);
    const replace = (next: PendingReplace) => {
        if (next.kind === "create") onCreate(next.config);
        else onOpenProject?.(next.project);
    };
    const replaceOrAsk = (next: PendingReplace) => {
        if (draft) setPending(next);
        else replace(next);
    };

    const onSubmit = ({ domain, version, useCaseId, description }: IStudioStarterFormValues) => {
        if (!domain || !version) return;
        const initial = createInitialMockConfigV2(domain, version);
        if (useCaseId.trim()) initial.meta.use_case_id = useCaseId.trim();
        if (description.trim()) initial.meta.description = description.trim();
        replaceOrAsk({ kind: "create", config: initial });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const openProjectFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        // Cleared, so choosing the same file again fires a change.
        input.value = "";
        if (!file) return;
        const read = readStudioProjectFile(await file.text());
        if (!read.ok) {
            toast.error(`Couldn't open ${file.name}`, { description: read.error });
            return;
        }
        replaceOrAsk({ kind: "open", project: read.content });
    };

    const handleTabChange = (value: string) => {
        if (value === ("flow-converter" satisfies StarterTabKey)) {
            setActiveModal("flowConverter");
        } else if (value === ("schema-generator" satisfies StarterTabKey)) {
            setActiveModal("schemaGenerator");
        }
    };

    return (
        <div className="flex min-h-full w-full justify-center mx-auto py-10">
            <div className="w-full max-w-2xl">
                <div className="rounded-2xl border border-n-30 bg-surface-elevated px-6 py-7 shadow-sm dark:border-border-default sm:px-8">
                    <header className="flex flex-col gap-1">
                        <h1 className="text-h4 font-bold text-text-primary">
                            ONDC Protocol Studio
                        </h1>
                        <p className="text-body-2 text-text-secondary">
                            Configure and test every flow for a domain in one config
                        </p>
                    </header>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {draft && onResume ? (
                            <Button
                                type="button"
                                onClick={onResume}
                                title={`Saved locally ${new Date(draft.savedAt).toLocaleString()}`}
                            >
                                <FolderOpenIcon className="size-4" />
                                Resume {draft.config.meta.domain} {draft.config.meta.version}
                            </Button>
                        ) : null}
                        {onOpenProject ? (
                            <>
                                <Button
                                    type="button"
                                    variant={draft ? "outline" : "default"}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Open a project saved with Download project"
                                >
                                    <ArrowUpTrayIcon className="size-4" />
                                    Open project file
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    className="hidden"
                                    aria-label="Project file"
                                    onChange={(event) => void openProjectFile(event)}
                                />
                            </>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            disabled
                            title={COMING_SOON}
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
                        <StudioFlowFields
                            control={control}
                            domainOptions={domainOptions}
                            versionOptions={versionOptions}
                            onDomainChange={() => setValue("version", "")}
                        />

                        <Button
                            type="submit"
                            size="lg"
                            disabled={!canContinue}
                            className={cn("w-fit rounded-xl")}
                        >
                            Continue to Studio
                            <ArrowRightIcon className="size-4" />
                        </Button>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                open={pending !== null}
                onOpenChange={(open) => {
                    if (!open) setPending(null);
                }}
                title="Replace your saved draft?"
                description={
                    draft
                        ? `Your saved draft of ${draft.config.meta.domain} ${draft.config.meta.version} — its graph, journeys and helpers — is replaced. To keep it, resume it and use Download project first.`
                        : undefined
                }
                confirmText="Replace draft"
                danger
                onConfirm={() => {
                    const next = pending;
                    setPending(null);
                    if (next) replace(next);
                }}
            />

            <FlowConverterModal isOpen={activeModal === "flowConverter"} onClose={closeModal} />

            <SchemaGeneratorModal
                isOpen={activeModal === "schemaGenerator"}
                defaultDomain={domain}
                onClose={closeModal}
            />
        </div>
    );
};

export default StudioStarterScreen;
