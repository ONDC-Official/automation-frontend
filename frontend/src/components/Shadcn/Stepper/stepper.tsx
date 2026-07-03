import { FaCheck } from "react-icons/fa";
import { cn } from "@/lib/utils";
import type { StepperProps } from "@/components/Shadcn/Stepper/types";

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <nav aria-label="Progress" data-slot="stepper">
            <ol className="relative flex w-full items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isLastStep = index === steps.length - 1;

                    return (
                        <li
                            key={index}
                            className="relative flex flex-1 items-center justify-center"
                        >
                            {!isLastStep && (
                                <div
                                    data-slot="stepper-connector"
                                    className={cn(
                                        "absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 transform",
                                        isCompleted ? "bg-primary" : "bg-muted"
                                    )}
                                />
                            )}

                            <div className="z-10 flex flex-col items-center">
                                <div
                                    data-slot="stepper-indicator"
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300",
                                        isCompleted
                                            ? "bg-primary text-primary-foreground"
                                            : isCurrent
                                              ? "border-primary bg-background text-primary"
                                              : "border-muted bg-background text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? <FaCheck className="h-4 w-4" /> : step.icon}
                                </div>
                                <span
                                    data-slot="stepper-label"
                                    className={cn(
                                        "mt-2 whitespace-nowrap text-center text-sm",
                                        isCompleted || isCurrent
                                            ? "font-medium text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
