import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import { Progress } from "@/components/Shadcn/Progress/progress";
import { IProgressWithLabelProps } from "@/components/Shadcn/Progress/types";
import { cn } from "@/lib/utils";

export const ProgressWithLabel = ({ id, label, value, className }: IProgressWithLabelProps) => (
    <Field className={cn("w-full min-w-[148px] gap-1.5", className)}>
        <Progress
            value={value}
            id={id}
            className="h-1.5 bg-n-30 **:data-[slot=progress-indicator]:bg-alert-500"
        />
        <FieldLabel
            htmlFor={id}
            className="w-full flex items-center text-caption-1 font-medium text-n-80"
        >
            <span>{label}</span>
            <span className="ml-auto font-semibold text-alert-500">{value}%</span>
        </FieldLabel>
    </Field>
);
