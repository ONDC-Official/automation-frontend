import { useConfigRun } from "@pages/protocol-playground/hooks/use-config-run";
import { useConfigIo } from "@pages/protocol-playground/hooks/use-config-io";

export type { RunResult } from "@pages/protocol-playground/hooks/use-config-run";

/**
 * Composed playground config operations. Kept as a thin re-export so existing
 * consumers keep a single import while the implementation is split into
 * `use-config-run.tsx` (execution) and `use-config-io.tsx` (import/export).
 */
export const useConfigOperations = () => {
    const run = useConfigRun();
    const io = useConfigIo(run.runConfig);

    return {
        exportConfig: io.exportConfig,
        importConfig: io.importConfig,
        clearConfig: io.clearConfig,
        runConfig: run.runConfig,
        submitCreateFlowSession: run.submitCreateFlowSession,
        runCurrentConfig: run.runCurrentConfig,
        retriggerSelectedExtraStep: run.retriggerSelectedExtraStep,
        exportConfigForDeployment: io.exportConfigForDeployment,
        runAllStepsForExport: io.runAllStepsForExport,
        finalizeExportForDeployment: io.finalizeExportForDeployment,
    };
};
