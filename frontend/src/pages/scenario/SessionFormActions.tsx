import { useNavigate } from "react-router-dom";
import { Button } from "@components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import { useAuth } from "@hooks/useAuth";
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
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className={className}>
            {extraActions}
            {user && (
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(ROUTES.PROFILE_HISTORY)}
                >
                    Past Report
                </Button>
            )}
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
