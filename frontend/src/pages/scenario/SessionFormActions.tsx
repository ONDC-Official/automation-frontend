import { Button } from "@components/Shadcn/Button";
import { ISessionFormActionsProps } from "@pages/scenario/types";

export const SessionFormActions = ({
    isSubmitting,
    submitType = "submit",
    submitDisabled = false,
    onSubmit,
    extraActions,
    onCancel,
    className = "flex flex-wrap items-center justify-end gap-3 pt-2",
}: ISessionFormActionsProps) => {
    return (
        <div className={className}>
            {extraActions}
            {onCancel && (
                <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                    Cancel
                </Button>
            )}
            <Button
                type={submitType}
                size="lg"
                disabled={submitDisabled || isSubmitting}
                onClick={submitType === "button" ? onSubmit : undefined}
            >
                {isSubmitting ? "Creating..." : "Submit"}
            </Button>
        </div>
    );
};
