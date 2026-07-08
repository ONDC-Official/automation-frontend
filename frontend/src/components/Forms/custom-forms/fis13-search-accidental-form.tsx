import { Fis13InsuranceSearchForm } from "./fis13-insurance-search-form";
import { SubmitEventParams } from "@/types/flow-types";

const MANUAL_BAP_INPUTS = [
    { code: "BUYER_NAME", label: "Buyer Name", type: "text" },
    { code: "BUYER_PHONE_NUMBER", label: "Buyer Phone Number", type: "tel" },
    { code: "BUYER_DOB", label: "Buyer Dob", type: "date" },
    { code: "BUYER_PAN_NUMBER", label: "Buyer Pan Number", type: "text" },
    { code: "BUYER_GENDER", label: "Buyer Gender", type: "select" },
    { code: "BUYER_PED", label: "Buyer Ped", type: "text" },
    { code: "SUM_INSURED", label: "Sum Insured", type: "text" },
    { code: "BUYER_EMAIL", label: "Buyer Email", type: "email" },
    { code: "TENURE", label: "Tenure", type: "text" },
    { code: "TENURE_TYPE", label: "Tenure Type", type: "text" },
];

export default function Fis13SearchAccidentalForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    return (
        <Fis13InsuranceSearchForm submitEvent={submitEvent} manualBapInputs={MANUAL_BAP_INPUTS} />
    );
}
