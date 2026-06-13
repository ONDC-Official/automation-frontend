import type { IAccordionStep } from "@/components/Accordion/types";
import { INewSessionFormValues } from "@/pages/scenario/types";

const workbenchBaseUrl = import.meta.env.VITE_BASE_URL;

/** Step definitions for the Scenario Testing guide accordion */
export const SCENARIO_GUIDE_STEPS: IAccordionStep[] = [
    {
        key: "1",
        label: "1. Enter Subscriber URL:",
        description: "Enter the correct Subscriber URL where you will receive requests.",
    },
    {
        key: "2",
        label: "2. Select Domain:",
        description:
            "Select the domain for which you want to test. For example: to test Retail F&B, select ONDC:RET11.",
    },
    {
        key: "3",
        label: "3. Select Version:",
        description:
            "Based on the domain selected, available versions will be displayed. Select the version you want to test. For example: for ONDC:RET11, version 1.2.5 is available.",
    },
    {
        key: "4",
        label: "4. Select Usecase:",
        description:
            "Based on domain and version, a list of use cases is shown. For example: for ONDC:RET11 version 1.2.5, F&B is displayed.",
    },
    {
        key: "5",
        label: "5. Select App Type:",
        description: `Select BAP if you are testing as a Buyer NP, or BPP if you are testing as a Seller NP. If you are a Buyer NP, Workbench acts as Seller NP and you receive requests at ${workbenchBaseUrl}/<domain>/<version>/seller (e.g. ${workbenchBaseUrl}/ONDC:RET11/1.2.5/seller). If you are a Seller NP, Workbench acts as Buyer NP and you receive requests at ${workbenchBaseUrl}/<domain>/<version>/buyer.`,
    },
    {
        key: "6",
        label: "6. Select Environment:",
        description:
            "Select the environment for which you want to test: STAGING or PRE-PRODUCTION. After filling the form, click Submit to open the session page.",
    },
    {
        key: "7",
        label: "7. Generate Report:",
        description:
            "After completing your test flows, click the Generate Report button (top-right of the session page) to compile a compliance report for the current session. The button is available only after at least one flow has been executed.",
    },
    {
        key: "8",
        label: "8. View Report:",
        description:
            "Once the report is generated, click View Report to open the full report. It includes session metadata, flow-wise execution summary with pass/fail status, request and response payloads, and validation errors with attribute-level compliance details.",
    },
    {
        key: "9",
        label: "9. Download / Share Report:",
        description:
            "Download the report by clicking the download button in the top-right corner of the session page.",
    },
];

export const DEFAULT_VALUES: INewSessionFormValues = {
    subscriberUrl: "",
    domain: "",
    version: "",
    usecaseId: "",
    npType: "BAP",
    env: "PRE-PRODUCTION",
    config: "",
};

export const LS_KEY = "flowTestingSessions";
export const SESSIONS_PER_PAGE = 4;
