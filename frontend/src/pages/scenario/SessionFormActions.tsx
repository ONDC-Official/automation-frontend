import { cva } from "class-variance-authority";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { ISessionFormActionsProps } from "@pages/scenario/types";

/**
 * Layout for the form's action row. `spacing` controls the top padding:
 * "default" clears space above the buttons, "none" sits flush with the field above.
 */
const sessionFormActionsVariants = cva(
    "flex flex-wrap items-center justify-end gap-3",
    {
        variants: {
            spacing: {
                default: "pt-2",
                none: "",
            },
        },
        defaultVariants: {
            spacing: "default",
        },
    }
);

export const SessionFormActions = ({
    isSubmitting,
    submitType = "submit",
    submitDisabled = false,
    onSubmit,
    extraActions,
    onCancel,
    spacing,
    className,
}: ISessionFormActionsProps) => {
    return (
        <div className={cn(sessionFormActionsVariants({ spacing }), className)}>
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
