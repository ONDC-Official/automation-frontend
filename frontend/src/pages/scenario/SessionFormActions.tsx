import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shadcn/Button/button";
import { ROUTES } from "@constants/routes";
import { ISessionFormActionsProps } from "@/pages/scenario/types";

export const SessionFormActions = ({
    isSubmitting,
    submitType = "submit",
    submitDisabled = false,
    onSubmit,
    extraActions,
    className = "flex items-center gap-3 pt-2",
}: ISessionFormActionsProps) => {
    const navigate = useNavigate();

    return (
        <div className={className}>
            <Button
                type={submitType}
                disabled={submitDisabled || isSubmitting}
                onClick={submitType === "button" ? onSubmit : undefined}
            >
                {isSubmitting ? "Creating..." : "Submit"}
            </Button>
            <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.PROFILE_HISTORY)}
            >
                Past Report
            </Button>
            {extraActions}
        </div>
    );
};
