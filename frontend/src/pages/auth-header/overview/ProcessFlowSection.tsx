import { FC, Fragment } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ProcessFlowSectionProps } from "@pages/auth-header/overview/types";

const cardShell =
    "rounded-xl border border-n-40 bg-white p-6 dark:border-n-60 dark:bg-surface-elevated";

const ProcessFlowSection: FC<ProcessFlowSectionProps> = ({ title, steps }) => (
    <div className={cardShell}>
        <h3 className="mb-4 text-xl font-bold text-n-900 dark:text-n-0">{title}</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {steps.map((step, index) => (
                <Fragment key={index}>
                    <div
                        className={`rounded-lg px-4 py-2 font-medium ${step.bgColor} ${step.textColor}`}
                    >
                        {step.label}
                    </div>
                    {index < steps.length - 1 && (
                        <ArrowRightIcon
                            className="h-3.5 w-3.5 shrink-0 text-n-60 dark:text-n-80"
                            aria-hidden
                        />
                    )}
                </Fragment>
            ))}
        </div>
    </div>
);

export default ProcessFlowSection;
