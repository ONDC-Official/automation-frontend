import { MetroStartEndStopForm } from "@/components/ui/forms/custom-forms/trv11-shared-metro-start-end-stop-form";

interface IMetroEndStopProps {
    submitEvent: (data: {
        jsonPath: Record<string, string | number>;
        formData: Record<string, string>;
    }) => Promise<void>;
}

const TRV11200MteroStartEndStopSelectionForm = ({ submitEvent }: IMetroEndStopProps) => (
    <MetroStartEndStopForm
        submitEvent={submitEvent}
        fulfillmentType="ROUTE"
        showVehicleCategoryField
    />
);

export default TRV11200MteroStartEndStopSelectionForm;
