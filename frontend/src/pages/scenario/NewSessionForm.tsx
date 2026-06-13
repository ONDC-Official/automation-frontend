import { SavedConfigPanel } from "@/pages/scenario/SavedConfigPanel";
import { ManualSessionForm } from "@/pages/scenario/ManualSessionForm";
import { useNewSessionForm } from "@/pages/scenario/hooks/useNewSessionForm";
import { INewSessionFormProps } from "@/pages/scenario/types";

const NewSessionForm = ({ isSubmitting = false, ...props }: INewSessionFormProps) => {
    const { showSavedConfigView, savedConfigProps, manualFormProps } = useNewSessionForm(props);

    if (showSavedConfigView) {
        return <SavedConfigPanel {...savedConfigProps} isSubmitting={isSubmitting} />;
    }

    return <ManualSessionForm {...manualFormProps} isSubmitting={isSubmitting} />;
};

export default NewSessionForm;
