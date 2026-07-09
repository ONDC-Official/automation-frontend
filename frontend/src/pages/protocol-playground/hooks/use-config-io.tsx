import { usePlayground } from "@pages/protocol-playground/hooks/playground-runtime";
import { toast } from "sonner";
import { MockRunner, MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { stringify as yamlStringify } from "yaml";
import { validateConfigGroups } from "@pages/protocol-playground/utils/step-group-rules";
import type { RunResult } from "@pages/protocol-playground/hooks/use-config-run";

type FileInputChangeEvent = Event & {
    target: HTMLInputElement & { files: FileList };
};

/**
 * Config import/export operations (JSON export, file import, clear, and the
 * "run all steps then export deployment YAML" flow). The deployment-export flow
 * depends on `runConfig` from `use-config-run.tsx`, which is passed in so the
 * two hook halves share a single run implementation.
 */
export const useConfigIo = (runConfig: (extraStep?: boolean) => Promise<RunResult>) => {
    const playgroundContext = usePlayground();

    const exportConfig = () => {
        if (!playgroundContext.config) {
            toast.error("No configuration to export");
            return;
        }
        const dataStr = JSON.stringify(playgroundContext.config, null, 2);
        const flowName = `${playgroundContext.config.meta.flowId}_playground_flow`;
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = flowName + ".json";
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
        toast.success("Configuration exported successfully");
    };

    const importConfig = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (event: Event) => {
            const file = (event as FileInputChangeEvent).target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const config = JSON.parse(
                            (e.target as FileReader | null)?.result as string
                        );
                        const validConfig = new MockRunner(config).validateConfig();
                        if (!validConfig.success) {
                            toast.error(`Invalid configuration: ${validConfig.errors?.join(", ")}`);
                            return;
                        }
                        const ruleError = validateConfigGroups(config);
                        if (ruleError) {
                            toast.error(ruleError);
                            return;
                        }
                        playgroundContext.setCurrentConfig(config);
                        toast.success("Configuration imported successfully");
                    } catch (error) {
                        console.error("Error reading file:", error);
                        const message = error instanceof Error ? error.message : "Unknown error";
                        toast.error(`Invalid JSON file or configuration: ${message}`);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const clearConfig = () => {
        playgroundContext.setCurrentConfig(undefined);
        playgroundContext.setActiveApi(undefined);
        toast.success("All configurations deleted");
    };

    const runAllStepsForExport = async (): Promise<MockPlaygroundConfigType | null> => {
        if (!playgroundContext.config) {
            toast.error("No configuration to export");
            return null;
        }
        try {
            playgroundContext.resetTransactionHistory();
            for (const step of playgroundContext.config.steps) {
                const res = await runConfig();
                if (!res?.success) {
                    toast.error(`Export stopped at step "${step.action_id}"`);
                    return null;
                }
            }
            return JSON.parse(JSON.stringify(playgroundContext.config)) as MockPlaygroundConfigType;
        } catch (e) {
            console.error("Error running steps for export:", e);
            toast.error("Export failed: " + (e instanceof Error ? e.message : "Unknown error"));
            return null;
        }
    };

    const finalizeExportForDeployment = async (
        snapshot: MockPlaygroundConfigType,
        descriptionOverrides: Record<string, string>
    ): Promise<void> => {
        try {
            for (const step of snapshot.steps) {
                if (Object.prototype.hasOwnProperty.call(descriptionOverrides, step.action_id)) {
                    step.description = descriptionOverrides[step.action_id];
                }
            }
            for (const historyEntry of snapshot.transaction_history) {
                const step = snapshot.steps.find((s) => s.action_id === historyEntry.action_id);
                if (step && historyEntry.payload !== undefined) {
                    step.examples = [
                        {
                            name: `example for ${step.api}`,
                            payload: historyEntry.payload,
                            type: "request",
                            description: step.description,
                        },
                    ];
                }
            }
            snapshot.transaction_history = [];
            const dataStr = yamlStringify(snapshot);
            const flowName = `${snapshot.meta.flowId}_deployment_config`;
            const dataUri = "data:application/yaml;charset=utf-8," + encodeURIComponent(dataStr);
            const link = document.createElement("a");
            link.setAttribute("href", dataUri);
            link.setAttribute("download", `${flowName}.yaml`);
            link.click();
            toast.success("Deployment configuration exported successfully");
        } catch (e) {
            console.error("Error finalizing export:", e);
            toast.error("Export failed: " + (e instanceof Error ? e.message : "Unknown error"));
        }
    };

    const exportConfigForDeployment = async () => {
        const snapshot = await runAllStepsForExport();
        if (!snapshot) return;
        await finalizeExportForDeployment(snapshot, {});
    };

    return {
        exportConfig,
        importConfig,
        clearConfig,
        exportConfigForDeployment,
        runAllStepsForExport,
        finalizeExportForDeployment,
    };
};
