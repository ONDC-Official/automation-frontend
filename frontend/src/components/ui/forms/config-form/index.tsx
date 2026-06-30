import { useContext } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/Shadcn/DatePicker";
import { DateTimePicker } from "@/components/Shadcn/DateTimePicker";
import { CheckboxGroup } from "@/components/Shadcn/Checkbox";
import { ComboBox } from "@/components/Shadcn/ComboBox";
import TextField from "@/components/Shadcn/TextField";
import { formatFormFieldForPayload } from "@/components/ui/forms/utils/date-utils";
import { buildSchemaFormSubmit } from "@/components/ui/forms/utils/schema-submit-utils";
import RET11NestedSelect from "@/components/ui/forms/ret11-nested-select";
import RET11NestedSelectForm from "@/components/ui/forms/custom-forms/ret11-nested-select-form";
import GenericForm from "@/components/ui/forms/generic-form";
import GenericFormWithPaste from "@/components/ui/forms/generic-form-with-paste";
import { SubmitEventParams } from "@/types/flow-types";
import Ret10GrocerySelectForm from "@/components/ui/forms/custom-forms/ret10-grocery-select-form";
import RetINVLInitForm from "@/components/ui/forms/custom-forms/retinvl-init-form";
import ProtocolHTMLForm from "@/components/ui/forms/custom-forms/protocol-html-form";
import ProtocolHTMLFormMulti from "@/components/ui/forms/custom-forms/protocol-html-form-multi";
import TRVSelectForm from "@/components/ui/forms/custom-forms/trv-select-form";
import TRV10SelectForm from "@/components/ui/forms/custom-forms/trv10-select-form";
import TRV10ScheduleForm from "@/components/ui/forms/custom-forms/trv10-schedule-form";
import TRV10ScheduleRentalForm from "@/components/ui/forms/custom-forms/trv10-schedule-rental-form";
import TRV11SelectForm from "@/components/ui/forms/custom-forms/trv11-select-form";
import TRV11PartialSelectForm from "@/components/ui/forms/custom-forms/trv11-201-partial-select-form";
import JsonSchemaForm from "@/pages/protocol-playground/ui/extras/rsjf-form";
import { isRideMapEnabled } from "@components/FlowShared/ride-map-utils";
import TRV12AirlineSelectForm from "@/components/ui/forms/custom-forms/trv12-airline-select-form";
import TRV12AirlineSeatSelectForm from "@/components/ui/forms/custom-forms/trv12-airline-seat-select-form";
import TRV13HotelSelectForm from "@/components/ui/forms/custom-forms/trv13-hotel-select-form";
import TRV12BusSeatCountSelectionForm from "@/components/ui/forms/custom-forms/trv12-seat-count-bus-selection-form";
import FinvuRedirectForm from "@/components/ui/forms/custom-forms/finvu-redirect-form";
import DynamicFormHandler from "@/components/ui/forms/handlers/dynamic-form-handler";
import ManualDynamicFormHandler from "@/components/ui/forms/handlers/manual-dynamic-form-handler";
import { SessionContext } from "@/context/context";
import TRV12IntercitySelectForm from "@/components/ui/forms/custom-forms/trv12-intercity-select-form";
import TRV13HotelSelectProviderForm from "@/components/ui/forms/custom-forms/trv13-hotel-select-provider";
import FIS13ItemSelectionForm from "@/components/ui/forms/custom-forms/fis13-select-form";
import TRV10RideHailingSelectForm from "@/components/ui/forms/custom-forms/trv10-201-ride-hailing-select-form";
import Fis13SearchAccidentalForm from "@/components/ui/forms/custom-forms/fis13-search-accidental-form";
import Fis13SearchHospicashForm from "@/components/ui/forms/custom-forms/fis13-search-hospicash-form";
import Fis13SearchTransitForm from "@/components/ui/forms/custom-forms/fis13-search-transit-form";
import Fis13SearchDiscoverProductForm from "@/components/ui/forms/custom-forms/fis13-search-discover-product-form";
import Trv11210MetroSelectForm from "@/components/ui/forms/custom-forms/trv11-210-metro-seat-select-form";
import Trv11Metro210EndStopUpdateForm from "@/components/ui/forms/custom-forms/trv11-210-metro-end-stop-update-form";
import Metro210StartEndStopSelection from "@/components/ui/forms/custom-forms/trv11-210-start-end-stop-selection-form";
import FIS12SelectForm from "@/components/ui/forms/custom-forms/fis12-select-form";
import FIS13AddonSelectForm from "@/components/ui/forms/custom-forms/fis13-addon-select-form";
import InsuranceSelectForm from "@/components/ui/forms/custom-forms/fis13-insurance-select-form";
import FIS12SearchForm from "@/components/ui/forms/custom-forms/fis12-search-form";
import TRV11SelectMetroForm from "@/components/ui/forms/custom-forms/trv11-select-metro-form";
import { RJSFSchema } from "@rjsf/utils";
import RetINVLInitILBPForm from "@/components/ui/forms/custom-forms/retinvl-ilbp-form";
import ReteB2BSelectForm from "@/components/ui/forms/custom-forms/reteb2b-select-form";
import ReteB2BInitOffersForm from "@/components/ui/forms/custom-forms/reteb2b-init-offers-form";
import TRV11InitMetroForm from "@/components/ui/forms/custom-forms/trv11-init-metro-form";
import FIS14MutualFundSelectForm from "@/components/ui/forms/custom-forms/fis14-mutual-fund-select-form";
import FIS14MutualFundRedemptionSelectForm from "@/components/ui/forms/custom-forms/fis14-mutual-fund-redemption-select-form";
import FIS14MutualFundSIPSelectForm from "@/components/ui/forms/custom-forms/fis14-mutual-fund-sip-select-form";
import RetINVLInitOffersForm from "@/components/ui/forms/custom-forms/retinvl-init-offers-form";
import TRV11200MteroStartEndStopSelectionForm from "@/components/ui/forms/custom-forms/trv11-200-start-end-stop-selection-form";
import TRV11Metro210CommonItemFulfillmentSelectionForm from "@/components/ui/forms/custom-forms/trv11-210-common-item-fulfillment-select-form";
import ManualIdOverride from "@/components/ui/forms/custom-forms/manual-id-override";
import { FormConfigType, FormFieldConfigType } from "@/components/ui/forms/config-form/types";

export type { FormConfigType, FormFieldConfigType } from "@/components/ui/forms/config-form/types";

export const FormConfig = ({
    formConfig,
    submitEvent,
    referenceData,
    flowId,
}: {
    formConfig: FormConfigType;
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    flowId?: string;
}) => {
    const sessionContext = useContext(SessionContext);
    const sessionId = sessionContext?.sessionId || "";
    const sessionData = sessionContext?.sessionData;

    const onSubmit = async (data: Record<string, string>) => {
        if (sessionData?.activeFlow === "RTO_PLUS_PART_CANCELLATION") {
            const nestedField = formConfig.find((field) => field.type === "nestedSelect");
            if (nestedField) {
                const nestedItems = data[nestedField.name];
                const itemsArray = Array.isArray(nestedItems) ? nestedItems : [];
                const filledItems = itemsArray.filter((item: { id: string }) => item.id !== "");
                if (filledItems.length < 2) {
                    toast.error("At least 2 items must be selected for this flow.");
                    return;
                }
            }
        }
        const formatedData: Record<string, string | number> = {};
        const formData: Record<string, string> = data;
        for (const key in data) {
            const fieldConfig = formConfig.find((field) => field.name === key);
            const payloadField = fieldConfig?.payloadField;
            if (payloadField) {
                formatedData[payloadField] = formatFormFieldForPayload(data[key], {
                    type: fieldConfig?.type,
                    payloadField,
                });
            }
        }
        await submitEvent({ jsonPath: formatedData, formData: formData });
    };

    const defaultValues: Record<string, unknown> = {};
    let isNoFieldVisible = false;

    formConfig.forEach((field) => {
        const { display = true } = field;

        if (field.default) {
            defaultValues[field.name] = field.default;
        }

        if (display) {
            isNoFieldVisible = true;
        }
    });

    // Check for MANUAL_DYNAMIC_FORM type (e.g. LAMF single_redirection): the
    // buyer copies the form URL and opens it manually — no open button/popup.
    if (formConfig.find((field) => field.type === "MANUAL_DYNAMIC_FORM")) {
        let transactionId: string | undefined = undefined;
        if (flowId && sessionData && sessionData.flowMap) {
            transactionId = sessionData.flowMap[flowId] || undefined;
        }

        const manualFormField = formConfig.find((field) => field.type === "MANUAL_DYNAMIC_FORM");

        return (
            <ManualDynamicFormHandler
                submitEvent={submitEvent}
                referenceData={referenceData}
                sessionId={sessionId}
                transactionId={transactionId || ""}
                formConfig={manualFormField}
            />
        );
    }

    // Check for DYNAMIC_FORM type
    if (formConfig.find((field) => field.type === "DYNAMIC_FORM")) {
        // Get transaction ID from session context using flowId
        let transactionId: string | undefined = undefined;
        if (flowId && sessionData && sessionData.flowMap) {
            transactionId = sessionData.flowMap[flowId] || undefined;
        }

        const dynamicFormField = formConfig.find((field) => field.type === "DYNAMIC_FORM");

        return (
            <DynamicFormHandler
                submitEvent={submitEvent}
                referenceData={referenceData}
                transactionId={transactionId || ""}
                formConfig={dynamicFormField}
            />
        );
    }

    // Check for FINVU_REDIRECT type
    if (formConfig.find((field) => field.type === "FINVU_REDIRECT")) {
        // Get transaction ID from session context using flowId
        let transactionId: string | undefined = undefined;
        if (flowId && sessionData && sessionData.flowMap) {
            transactionId = sessionData.flowMap[flowId] || undefined;
        }

        return (
            <FinvuRedirectForm
                submitEvent={submitEvent}
                referenceData={referenceData}
                sessionId={sessionId}
                transactionId={transactionId || ""}
            />
        );
    }

    if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
        return <Ret10GrocerySelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "retinvl_init")) {
        return <RetINVLInitForm submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "retinvl_init_offers")) {
        return <RetINVLInitOffersForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "retinvl_init_ilbp")) {
        return <RetINVLInitILBPForm submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "ret11_nestedSelect")) {
        const field = formConfig.find((field) => field.type === "ret11_nestedSelect")!;
        return (
            <RET11NestedSelectForm
                name={field.name}
                label={field.label}
                submitEvent={submitEvent}
            />
        );
    }

    if (formConfig.find((field) => field.type === "reteb2b_select")) {
        return <ReteB2BSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "reteb2b_init_offers")) {
        return <ReteB2BInitOffersForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "insurance_select")) {
        return <InsuranceSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis13_select")) {
        return <FIS13ItemSelectionForm submitEvent={submitEvent} referenceData={referenceData} />;
    }

    if (formConfig.find((field) => field.type === "trv12_bus_seat_selection")) {
        return <TRV12BusSeatCountSelectionForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "airline_seat_select")) {
        return <TRV12AirlineSeatSelectForm submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "HTML_FORM_MULTI")) {
        return ProtocolHTMLFormMulti({
            submitEvent: submitEvent,
            referenceData: referenceData,
            HtmlFormConfigInFlow: formConfig.find(
                (field) => field.type === "HTML_FORM_MULTI"
            ) as FormFieldConfigType,
        });
    }
    if (formConfig.find((field) => field.type === "HTML_FORM")) {
        return ProtocolHTMLForm({
            submitEvent: submitEvent,
            referenceData: referenceData,
            HtmlFormConfigInFlow: formConfig.find(
                (field) => field.type === "HTML_FORM"
            ) as FormFieldConfigType,
        });
    }

    // Default: GenericForm
    if (formConfig.find((field) => field.type === "trv10_select")) {
        return <TRV10SelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_schedule")) {
        return <TRV10ScheduleForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_schedule_rental")) {
        return <TRV10ScheduleRentalForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv_select")) {
        return <TRVSelectForm submitEvent={submitEvent} flowId={flowId} />;
    }

    if (formConfig.find((field) => field.type === "trv11_select")) {
        return <TRV11SelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_201_partial_select")) {
        return <TRV11PartialSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "airline_select")) {
        return <TRV12AirlineSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "intercity_select")) {
        return <TRV12IntercitySelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "hotel_select")) {
        return <TRV13HotelSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv13_select_provider")) {
        return <TRV13HotelSelectProviderForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_201_select")) {
        return <TRV10RideHailingSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_accidental_fis13")) {
        return <Fis13SearchAccidentalForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_hospicash_fis13")) {
        return <Fis13SearchHospicashForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_transit_fis13")) {
        return <Fis13SearchTransitForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_discover_product_fis13")) {
        return <Fis13SearchDiscoverProductForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_select")) {
        return <Trv11210MetroSelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_update_end_station")) {
        return <Trv11Metro210EndStopUpdateForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_start_end_stop_selection")) {
        return <Metro210StartEndStopSelection submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_start_end_stop_selection_200")) {
        return <TRV11200MteroStartEndStopSelectionForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis12_select_pl")) {
        return <FIS12SelectForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis13_addon_select")) {
        return <FIS13AddonSelectForm submitEvent={submitEvent} referenceData={referenceData} />;
    }
    if (formConfig.find((field) => field.type === "fis12_search_pl")) {
        return <FIS12SearchForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "init_metro_trv11")) {
        return <TRV11InitMetroForm submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "select_metro_trv11")) {
        return <TRV11SelectMetroForm submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "fis14_mutul_fund_select")) {
        return <FIS14MutualFundSelectForm submitEvent={submitEvent} formConfig={formConfig} />;
    }
    if (formConfig.find((field) => field.type === "fis14_mf_redemption_select")) {
        return (
            <FIS14MutualFundRedemptionSelectForm
                submitEvent={submitEvent}
                formConfig={formConfig}
            />
        );
    }
    if (formConfig.find((field) => field.type === "fis14_mf_sip_select")) {
        return <FIS14MutualFundSIPSelectForm submitEvent={submitEvent} formConfig={formConfig} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_common_item_fulfillment_select")) {
        return (
            <TRV11Metro210CommonItemFulfillmentSelectionForm
                key={flowId}
                submitEvent={submitEvent}
                flowId={flowId}
            />
        );
    }

    // manual_id: a step that just needs a manual trigger. Its schema fixes `id` to the action, so
    // there's no real choice — render an override form with only a submit button. Must come before
    // the generic schema check below (a manual_id field also carries a `schema`).
    if (formConfig.find((field) => field.type === "manual_id")) {
        const manualField = formConfig.find((field) => field.type === "manual_id")!;
        const idSchema = (manualField.schema?.properties?.id ?? {}) as {
            default?: string;
            enum?: string[];
        };
        const actionId = idSchema.default ?? idSchema.enum?.[0];
        return <ManualIdOverride submitEvent={submitEvent} actionId={actionId} />;
    }

    // NOTE: The JsonSchemaForm check must come after all other specific form type checks above.
    if (formConfig.find((f) => f.schema)) {
        const schemaField = formConfig.find((f) => f.schema);
        const schema = schemaField!.schema as RJSFSchema;

        const onSubmitSchema = async (data: Record<string, unknown>) => {
            const { jsonPath, formData: schemaFormData } = buildSchemaFormSubmit(
                schema,
                data,
                formConfig
            );
            await submitEvent({ jsonPath, formData: schemaFormData });
        };

        return (
            <JsonSchemaForm
                variant="flow"
                schema={schema}
                onSubmit={onSubmitSchema}
                mapEnabled={isRideMapEnabled(sessionData?.domain, sessionData?.version)}
            />
        );
    }

    // Check if form has fields that can be populated from on_search (like item_id for TRV13)
    const enablePaste = formConfig.some((field) => field.name === "item_id");
    const FormComponent = enablePaste ? GenericFormWithPaste : GenericForm;

    return (
        <FormComponent
            defaultValues={defaultValues as Record<string, string>}
            className="space-y-2"
            onSubmit={onSubmit}
            triggerSubmit={!isNoFieldVisible}
            enablePaste={enablePaste}
        >
            {formConfig.map((field) => {
                const { display = true } = field;
                if (!display) {
                    return <></>;
                }

                switch (field.type) {
                    case "text":
                        return (
                            <TextField
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                required={field.required !== false}
                            />
                        );
                    case "date":
                        return (
                            <DatePicker
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                required={field.required !== false}
                            />
                        );
                    case "datetime-local":
                        return (
                            <DateTimePicker
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                required={field.required !== false}
                            />
                        );
                    case "select":
                        return (
                            <ComboBox
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                options={field.values || []}
                                required={field.required !== false}
                            />
                        );
                    case "checkbox":
                        return (
                            <CheckboxGroup
                                key={field.name}
                                options={field.options || []}
                                label={field.label}
                                name={field.name}
                                defaultValue={field.default as string[] | undefined}
                            />
                        );
                    case "nestedSelect":
                        return (
                            <RET11NestedSelect
                                label={field.label}
                                name={field.name}
                                sessionData={sessionData}
                            />
                        );
                    default:
                        return <></>;
                }
            })}
        </FormComponent>
    );
};
