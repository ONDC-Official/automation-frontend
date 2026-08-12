import type { IExpectedField } from "./html-form-contract";

export const FORM_CONTRACTS: Record<string, IExpectedField[]> = {
    // Mirrors the current Proposer_Details_form HTML, in document order. The PED questions moved to
    // ped_details_form; only gstin is optional here — everything else is marked required in the HTML.

    "FIS13/health/Proposer_Details_form": [
        { name: "firstName", kind: "textlike", required: true },
        { name: "lastName", kind: "textlike", required: true },
        { name: "address", kind: "textlike", required: true },
        { name: "dob", kind: "textlike", inputType: "date", required: true },
        { name: "gender", kind: "select", required: true },
        { name: "politicallyExposedPerson", kind: "checkbox-single", required: true },
        { name: "email", kind: "textlike", required: true },
        { name: "phone", kind: "textlike", required: true },
        { name: "gstin", kind: "textlike" },
        { name: "weight", kind: "textlike", required: true },
        { name: "height", kind: "textlike", required: true },
        { name: "relation", kind: "select", required: true },
    ],

    // Mirrors the current family_information_form HTML, in document order. pincode is only required
    // dynamically (seller JS toggles it when panIndia is "no"), so the static contract leaves it optional.

    "FIS13/health/family_information_form": [
        { name: "firstName", kind: "textlike" },
        { name: "lastName", kind: "textlike" },
        { name: "dob", kind: "textlike", inputType: "date", required: true },
        { name: "gender", kind: "select", required: true },
        { name: "phone", kind: "textlike", required: true },
        { name: "email", kind: "textlike" },
        { name: "relation", kind: "select", required: true },
        { name: "PED", kind: "select", required: true },
        { name: "diabetes", kind: "checkbox-single" },
        { name: "bloodPressure", kind: "checkbox-single" },
        { name: "heartAilments", kind: "checkbox-single" },
        { name: "other", kind: "checkbox-single" },
        { name: "height", kind: "textlike", required: true },
        { name: "weight", kind: "textlike", required: true },
        { name: "amount", kind: "textlike", inputType: "number", required: true },
        { name: "planType", kind: "select", required: true },
        { name: "panIndia", kind: "checkbox-single", required: true },
        { name: "pincode", kind: "textlike" },
        { name: "tenure", kind: "textlike", inputType: "number" },
        { name: "panValue", kind: "textlike" },
        { name: "dobAsPerPan", kind: "textlike", inputType: "date" },
    ],

    // Mirrors the current individual_information_form HTML, in document order.

    "FIS13/health/individual_information_form": [
        { name: "firstName", kind: "textlike", required: true },
        { name: "lastName", kind: "textlike", required: true },
        { name: "dob", kind: "textlike", inputType: "date", required: true },
        { name: "gender", kind: "select", required: true },
        { name: "PED", kind: "select", required: true },
        { name: "phone", kind: "textlike", inputType: "tel", required: true },
        { name: "email", kind: "textlike", inputType: "email" },
        { name: "amount", kind: "textlike", inputType: "number", required: true },
        { name: "panIndia", kind: "checkbox-single", required: true },
        { name: "height", kind: "textlike", required: true },
        { name: "weight", kind: "textlike", required: true },
        { name: "pincode", kind: "textlike" },
        { name: "diabetes", kind: "checkbox-single" },
        { name: "bloodPressure", kind: "checkbox-single" },
        { name: "heartAilments", kind: "checkbox-single" },
        { name: "other", kind: "checkbox-single" },
        { name: "panValue", kind: "textlike" },
    ],

    // Mirrors the current nominee_details_form HTML, in document order. Nominee 1 is mandatory,
    // nominee 2 is entirely optional.

    "FIS13/health/nominee_details_form": [
        { name: "nominee1_firstName", kind: "textlike", required: true },
        { name: "nominee1_lastName", kind: "textlike", required: true },
        { name: "nominee1_dob", kind: "textlike", inputType: "date", required: true },
        { name: "nominee1_relation", kind: "select", required: true },
        { name: "nominee2_firstName", kind: "textlike" },
        { name: "nominee2_lastName", kind: "textlike" },
        { name: "nominee2_dob", kind: "textlike", inputType: "date" },
        { name: "nominee2_relation", kind: "select" },
    ],

    // Mirrors the current ped_details_form HTML, in document order. The form marks no field required,
    // so every entry is optional; set required: true here only where the protocol demands an answer.
    "FIS13/health/ped_details_form": [
        { name: "question1_1", kind: "select" },
        { name: "question1_2", kind: "select" },
        { name: "question1_3", kind: "select" },
        { name: "question1_3a", kind: "textlike" },
        { name: "question1_4", kind: "select" },
        { name: "question1_4a", kind: "textlike" },
        { name: "question2_1", kind: "select" },
        { name: "question3_1", kind: "select" },
        { name: "question3_2", kind: "select" },
        { name: "question3_3", kind: "select" },
        { name: "question3_4", kind: "select" },
        { name: "question3_5", kind: "select" },
        { name: "question3_6", kind: "select" },
        { name: "question3_7", kind: "select" },
        { name: "question3_8", kind: "select" },
        { name: "question3_9", kind: "select" },
        { name: "question3_10", kind: "select" },
        { name: "question3_11", kind: "select" },
        { name: "question3_12", kind: "select" },
        { name: "question3_13", kind: "select" },
        { name: "question3_14", kind: "select" },
        { name: "question3_15", kind: "select" },
        { name: "question3_16", kind: "select" },
        { name: "question3_17", kind: "select" },
        { name: "question3_18", kind: "select" },
        { name: "question4_1", kind: "select" },
        { name: "question4_1a", kind: "textlike" },
        { name: "question5_1", kind: "select" },
        { name: "question5_1a", kind: "textlike" },
        { name: "question6_1", kind: "select" },
        { name: "question7_1", kind: "select" },
        { name: "question7_1a", kind: "textlike" },
        { name: "question8_1", kind: "select" },
        { name: "question8_1a", kind: "textlike" },
        { name: "question9_1", kind: "select" },
        { name: "question9_1a", kind: "textlike" },
        { name: "question10_1", kind: "select" },
    ],

    "FIS13/motor/pan_details_form": [
        { name: "dob", kind: "textlike", inputType: "date" },
        { name: "panValue", kind: "textlike" },
    ],
    // Mirrors the current personal_details_form HTML, in document order. Every field is required.

    "FIS13/motor/personal_details_form": [
        { name: "name", kind: "textlike", required: true },
        { name: "address", kind: "textlike", required: true },
        { name: "pincode", kind: "textlike", required: true },
        { name: "state", kind: "select", required: true },
        { name: "dob", kind: "textlike", required: true },
        { name: "gender", kind: "select", required: true },
        { name: "email", kind: "textlike", required: true },
        { name: "phone", kind: "textlike", required: true },
    ],

    // Mirrors the current vehicle_details_form HTML, in document order.

    "FIS13/motor/vehicle_details_form": [
        { name: "firstName", kind: "textlike", required: true },
        { name: "lastName", kind: "textlike", required: true },
        { name: "email", kind: "textlike" },
        { name: "phone", kind: "textlike" },
        { name: "gender", kind: "select", required: true },
        { name: "vehicleUniqueCode", kind: "textlike" },
        { name: "rtoCode", kind: "textlike", required: true },
        { name: "registrationDate", kind: "textlike", inputType: "date", required: true },
        { name: "idv", kind: "textlike" },
        { name: "coverType", kind: "select" },
        { name: "PersonalAccidentCover", kind: "textlike" },
        { name: "registrationNumber", kind: "textlike" },
        { name: "paTenure", kind: "textlike" },
        { name: "policyTenure", kind: "textlike" },
        { name: "previousPolicyInsurerName", kind: "textlike" },
        { name: "previousPolicyType", kind: "textlike" },
        { name: "previousPolicyNumber", kind: "textlike" },
        { name: "previousPolicyDate", kind: "textlike", inputType: "date" },
        { name: "previousPolicyCustomerName", kind: "textlike" },
        { name: "claimStatus", kind: "checkbox-single" },
        { name: "ncb", kind: "textlike" },
    ],

    // Mirrors the current vehicle_nominee_form HTML, in document order. Vehicle identifiers and the
    // nominee block are mandatory; previous-policy and appointee details are optional.
    "FIS13/motor/vehicle_nominee_details_form": [
        { name: "registrationNumber", kind: "textlike", required: true },
        { name: "chassisNumber", kind: "textlike", required: true },
        { name: "engineNumber", kind: "textlike", required: true },
        { name: "previousPolicyNumber", kind: "textlike" },
        { name: "previousPolicyIssuer", kind: "textlike" },
        { name: "previousTPPolicyIssuer", kind: "textlike" },
        { name: "previousTPPolicyNumber", kind: "textlike" },
        { name: "nomineeName", kind: "textlike", required: true },
        { name: "nomineeDOB", kind: "textlike", inputType: "date", required: true },
        { name: "relationshipNominee", kind: "select", required: true },
        { name: "apointeeName", kind: "textlike" },
        { name: "apointeeRelationship", kind: "textlike" },
    ],
};
