import { usePlayground } from "@pages/protocol-playground/hooks/playground-runtime";
import { toast } from "sonner";
import JsonSchemaForm, { PLAYGROUND_RJSF_FORM_ID } from "@components/JsonSchemaForm";
import { isRideMapEnabled } from "@components/FlowShared/ride-map-utils";
import { calcCurrentIndex } from "@pages/protocol-playground/mock-engine";
import { MockRunner } from "@ondc/automation-mock-runner";
import { createFlowSessionWithPlayground } from "@pages/protocol-playground/utils/request-utils";
import { useCreatePlaygroundSessionMutation } from "@store/api";
import { GetRequestEndpoint } from "@components/FlowShared/guides";
import MockDynamicForm from "@pages/protocol-playground/ui/components/mock-dynamic-form";
import { PlaygroundSchemaFormShell } from "@pages/protocol-playground/ui/playground-schema-form-shell";
import { v4 as uuidv4 } from "uuid";
import { configForGroup, getGroupSteps } from "@pages/protocol-playground/utils/step-group";
import { getFullSession } from "@pages/protocol-playground/utils/transaction-view";

type JsonSchema = Record<string, unknown>;
type FormValues = Record<string, unknown>;

export type RunResult = { success: boolean };

/**
 * Playground execution operations: running steps (main + extra), payload
 * generation, flow-session creation, and retriggering. The IO/export half of
 * the former `useConfigOperations` lives in `use-config-io.tsx` and composes
 * `runConfig` from here for its "run all steps then export" flow.
 */
export const useConfigRun = () => {
    const playgroundContext = usePlayground();
    const modal = playgroundContext.useModal;
    const [createPlaygroundSession] = useCreatePlaygroundSessionMutation();

    const showFormModal = (schema: JsonSchema, onSubmit: (formData: FormValues) => void) => {
        modal.openModal(
            <PlaygroundSchemaFormShell
                title="Enter Input Data"
                formId={PLAYGROUND_RJSF_FORM_ID}
                onCancel={modal.closeModal}
            >
                <JsonSchemaForm
                    schema={schema}
                    onSubmit={async (data) => {
                        modal.closeModal();
                        await onSubmit(data);
                    }}
                    mapEnabled={isRideMapEnabled(
                        playgroundContext.config?.meta?.domain,
                        playgroundContext.config?.meta?.version
                    )}
                />
            </PlaygroundSchemaFormShell>,
            { className: "max-w-xl" }
        );
        toast.success("Please fill in the form to continue");
    };

    // return true if payload execution was successful — main steps
    const executePayload = async (data: {
        actionId: string;
        action: string;
        inputs: FormValues;
    }) => {
        playgroundContext.setLoading(true);
        try {
            const config = playgroundContext.config;
            if (!config) {
                toast.error("No configuration found");
                playgroundContext.setLoading(false);
                return false;
            }
            const inputs = data.inputs;
            const externalData = {
                ...config.transaction_data?.external_session_data,
                bapUri: config.transaction_data.bap_uri,
                bppUri: config.transaction_data.bpp_uri,
            };
            const result = await new MockRunner(config).runGeneratePayload(
                data.actionId,
                inputs,
                externalData
            );

            if (!result) {
                toast.error("No result from code execution");
                playgroundContext.setLoading(false);
                return false;
            }
            playgroundContext.setActiveTerminalData((s) => [...s, result]);
            if (result.success) {
                playgroundContext.updateTransactionHistory(
                    data.actionId,
                    data.action,
                    result.result
                );
            }
            modal.closeModal();
            playgroundContext.setLoading(false);
            toast.success("Payload generated. Check console for details.");
            return result.success;
        } catch (e) {
            playgroundContext.setLoading(false);
            console.error("Error executing payload:", e);
            return false;
        }
    };

    // Execute one run of an extra step. The session is built from the WHOLE
    // transaction history (main + extra), and the result is appended to the
    // extra step's array-payload history entry.
    const executeExtraStep = async (data: {
        actionId: string;
        action: string;
        inputs: FormValues;
    }) => {
        playgroundContext.setLoading(true);
        try {
            const config = playgroundContext.config;
            if (!config) {
                toast.error("No configuration found");
                playgroundContext.setLoading(false);
                return false;
            }
            const session = await getFullSession(config);
            Object.assign(session, {
                ...config.transaction_data?.external_session_data,
                bapUri: config.transaction_data.bap_uri,
                bppUri: config.transaction_data.bpp_uri,
            });
            if (Object.keys(data.inputs).length > 0) {
                session.user_inputs = data.inputs;
            }
            const runnerConfig = { ...config, steps: getGroupSteps(config, "extra") };
            const result = await new MockRunner(runnerConfig).runGeneratePayloadWithSession(
                data.actionId,
                session
            );

            if (!result) {
                toast.error("No result from code execution");
                playgroundContext.setLoading(false);
                return false;
            }
            playgroundContext.setActiveTerminalData((s) => [...s, result]);
            if (result.success) {
                playgroundContext.appendExtraStepRun(data.actionId, data.action, result.result);
            }
            modal.closeModal();
            playgroundContext.setLoading(false);
            toast.success("Extra step executed. Check console for details.");
            return result.success;
        } catch (e) {
            playgroundContext.setLoading(false);
            console.error("Error executing extra step:", e);
            return false;
        }
    };

    const runConfig = async (extraStep = false) => {
        const config = playgroundContext.config;
        const group = extraStep ? "extra" : "main";
        const steps = getGroupSteps(config, group);
        if (!config || steps.length === 0) {
            toast.error("No steps to run");
            return { success: false } as RunResult;
        }
        const executedCount = steps.filter((s) =>
            config.transaction_history.some((h) => h.action_id === s.action_id)
        ).length;
        if (executedCount === steps.length) {
            toast.info("All steps have already been executed");
            return { success: false } as RunResult;
        }
        const currentIndex = calcCurrentIndex(configForGroup(config, group));
        if (currentIndex === -1 || currentIndex >= steps.length) {
            toast.info("All steps have been executed");
            return { success: false } as RunResult;
        }
        const currentStep = steps[currentIndex];

        if (currentStep.api === "dynamic_form" || currentStep.api === "html_form") {
            const htmlForm64 = currentStep.mock.formHtml;
            if (!htmlForm64) {
                toast.error("No form HTML provided for dynamic_form action");
                return { success: false } as RunResult;
            }
            const htmlForm = MockRunner.decodeBase64(htmlForm64);
            return new Promise<RunResult>((resolve) => {
                const handleFormSubmit = async (formData: FormValues) => {
                    modal.closeModal();
                    if (extraStep) {
                        playgroundContext.appendExtraStepRun(
                            currentStep.action_id,
                            currentStep.api,
                            formData
                        );
                    } else {
                        playgroundContext.updateTransactionHistory(
                            currentStep.action_id,
                            currentStep.api,
                            formData,
                            {
                                submissionID: uuidv4(),
                            }
                        );
                    }
                    resolve({ success: true } as RunResult);
                };
                modal.openModal(
                    <PlaygroundSchemaFormShell title="Fill the form">
                        <MockDynamicForm htmlForm={htmlForm} onSubmit={handleFormSubmit} />
                    </PlaygroundSchemaFormShell>,
                    { className: "max-w-xl" }
                );
                toast.success("Please fill in the form to continue");
            });
        }

        try {
            const inputs = currentStep.mock.inputs || {};

            const runStep = (stepInputs: FormValues) =>
                extraStep
                    ? executeExtraStep({
                          actionId: currentStep.action_id,
                          action: currentStep.api,
                          inputs: stepInputs,
                      })
                    : executePayload({
                          actionId: currentStep.action_id,
                          action: currentStep.api,
                          inputs: stepInputs,
                      });

            // No inputs needed - execute immediately
            if (inputs === null || Object.keys(inputs).length === 0) {
                const res = await runStep({});
                return {
                    success: res,
                } as RunResult;
            }

            // Inputs needed - return a Promise that resolves when form is submitted
            return new Promise<RunResult>((resolve) => {
                const handleFormSubmit = async (formData: FormValues) => {
                    modal.closeModal();
                    const res = await runStep(formData);
                    resolve({ success: res });
                };

                if (!currentStep.mock.inputs.jsonSchema) {
                    toast.error("No input schema defined for this action");
                    resolve({ success: false } as RunResult);
                    return;
                }

                showFormModal(currentStep.mock.inputs.jsonSchema, handleFormSubmit);
            });
        } catch (e) {
            console.error("Error generating payload:", e);
            toast.error("Error generating payload. Check console for details.");
            return {
                success: false,
            } as RunResult;
        }
    };

    // Extracted function to create and open flow session in new tab
    const createAndOpenFlowSession = async (subscriberUrl: string, role: "BAP" | "BPP") => {
        if (!playgroundContext.config) {
            toast.error("No configuration found");
            return;
        }

        playgroundContext.setLoading(true);
        try {
            const result = await createFlowSessionWithPlayground(
                playgroundContext.config,
                subscriberUrl,
                role,
                createPlaygroundSession
            );

            if (!result) {
                toast.error("Error creating flow session");
                return;
            }

            // Open flow session in new tab
            const currentUrl = window.location.origin;
            const newTabUrl = `${currentUrl}/flow-testing?sessionId=${result}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${role}`;
            window.open(newTabUrl, "_blank");

            toast.success("Flow session created! Opening in new tab...");
        } catch (error) {
            console.error("Error creating flow session:", error);
            toast.error("Failed to create flow session");
        } finally {
            playgroundContext.setLoading(false);
        }
    };

    const submitCreateFlowSession = async ({
        subscriberUrl,
        role,
    }: {
        subscriberUrl: string;
        role: "BAP" | "BPP";
    }) => {
        if (subscriberUrl === "testing") {
            const subUrlBap = GetRequestEndpoint(
                playgroundContext.config?.meta.domain || "",
                playgroundContext.config?.meta.version || "",
                "BAP"
            );
            const subUrlBpp = GetRequestEndpoint(
                playgroundContext.config?.meta.domain || "",
                playgroundContext.config?.meta.version || "",
                "BPP"
            );
            await createAndOpenFlowSession(subUrlBap, "BPP");
            await createAndOpenFlowSession(subUrlBpp, "BAP");
            return;
        }

        const regex = /^(http|https):\/\/[^ "]+$/;
        if (!subscriberUrl || !regex.test(subscriberUrl)) {
            toast.error("Please enter a valid URL");
            return;
        }

        await createAndOpenFlowSession(subscriberUrl, role);
    };

    const runCurrentConfig = async (extraStep = false) => {
        if (!playgroundContext.config) {
            toast.error("No configuration found");
            return;
        }
        const activeApi = playgroundContext.activeApi;
        if (!activeApi) {
            toast.error("No active API selected");
            return;
        }
        try {
            const config = playgroundContext.config;
            if (extraStep) {
                // Reset only extra-step history — keep main-step history intact
                const extraIds = new Set(getGroupSteps(config, "extra").map((s) => s.action_id));
                const firstExtra = config.transaction_history.find((h) =>
                    extraIds.has(h.action_id)
                );
                if (firstExtra) {
                    playgroundContext.resetTransactionHistory(firstExtra.action_id);
                }
            } else {
                playgroundContext.resetTransactionHistory();
            }
            const steps = getGroupSteps(config, extraStep ? "extra" : "main");
            for (const step of steps) {
                const res = await runConfig(extraStep);
                if (!res?.success) {
                    toast.error(`Execution stopped at action ${step.action_id}`);
                    break;
                }
                if (step.action_id === activeApi) {
                    break;
                }
            }
        } catch (e) {
            console.error("Error running current config:", e);
        }
    };

    // Re-run the currently selected extra step, appending another payload to its
    // transaction-history entry. Visible only while the extra group is selected.
    const retriggerSelectedExtraStep = async () => {
        const config = playgroundContext.config;
        if (!config) {
            toast.error("No configuration found");
            return;
        }
        const actionId = playgroundContext.activeApi;
        if (!actionId) {
            toast.error("Select an extra step to retrigger");
            return;
        }
        const step = getGroupSteps(config, "extra").find((s) => s.action_id === actionId);
        if (!step) {
            toast.error("Selected step is not an extra step");
            return;
        }

        if (step.api === "dynamic_form" || step.api === "html_form") {
            const htmlForm64 = step.mock.formHtml;
            if (!htmlForm64) {
                toast.error("No form HTML provided for this form step");
                return;
            }
            const htmlForm = MockRunner.decodeBase64(htmlForm64);
            modal.openModal(
                <PlaygroundSchemaFormShell title="Fill the form">
                    <MockDynamicForm
                        htmlForm={htmlForm}
                        onSubmit={async (formData: FormValues) => {
                            modal.closeModal();
                            playgroundContext.appendExtraStepRun(
                                step.action_id,
                                step.api,
                                formData
                            );
                        }}
                    />
                </PlaygroundSchemaFormShell>,
                { className: "max-w-xl" }
            );
            toast.success("Please fill in the form to continue");
            return;
        }

        const inputs = step.mock.inputs || {};
        if (inputs === null || Object.keys(inputs).length === 0) {
            await executeExtraStep({ actionId, action: step.api, inputs: {} });
            return;
        }
        if (!step.mock.inputs.jsonSchema) {
            toast.error("No input schema defined for this action");
            return;
        }
        showFormModal(step.mock.inputs.jsonSchema, async (formData: FormValues) => {
            modal.closeModal();
            await executeExtraStep({ actionId, action: step.api, inputs: formData });
        });
    };

    return {
        runConfig,
        runCurrentConfig,
        retriggerSelectedExtraStep,
        submitCreateFlowSession,
    };
};
