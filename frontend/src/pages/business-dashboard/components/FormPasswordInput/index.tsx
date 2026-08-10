import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@components/Shadcn/Input";
import { cn } from "@pages/business-dashboard/lib/utils";
import type { IProps } from "./types";

const FormPasswordInput = ({ label, registration, error, hint, className, ...props }: IProps) => {
    const id = useId();
    const [revealed, setRevealed] = useState(false);

    return (
        <div data-slot="form-password-input" className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <div className="relative">
                <Input
                    id={id}
                    type={revealed ? "text" : "password"}
                    className="pr-10"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error || hint ? `${id}-message` : undefined}
                    {...registration}
                    {...props}
                />
                <button
                    type="button"
                    aria-label={revealed ? "Hide password" : "Show password"}
                    onClick={() => setRevealed((current) => !current)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors"
                >
                    {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>
            {(error || hint) && (
                <p
                    id={`${id}-message`}
                    className={cn(
                        "text-xs",
                        error ? "text-status-fail-ink" : "text-muted-foreground"
                    )}
                >
                    {error ?? hint}
                </p>
            )}
        </div>
    );
};

export default FormPasswordInput;
