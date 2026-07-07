import { MetroStartEndStopForm } from "@/components/ui/forms/custom-forms/trv11-shared-metro-start-end-stop-form";

interface IMetroEndStopProps {
    submitEvent: (data: {
        jsonPath: Record<string, string | number>;
        formData: Record<string, string>;
    }) => Promise<void>;
}

const Metro210StartEndStopSelection = ({ submitEvent }: IMetroEndStopProps) => (
    <MetroStartEndStopForm
        submitEvent={submitEvent}
        fulfillmentType="TRIP"
        showVehicleCategoryField={false}
    />
);

export default Metro210StartEndStopSelection;
