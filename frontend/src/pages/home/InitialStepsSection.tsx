import { FC } from "react";
import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { quickSteps } from "@pages/home/constants";
import { QuickStepBadge } from "@pages/home/QuickStepBadge";
import { cn } from "@/lib/utils";

const IntialStepsSection: FC = () => (
    <section className="border-y border-n-30 bg-n-0 dark:bg-surface-page dark:border-border-default">
        <div className="mx-auto py-8 px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20">
            <div
                className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10",
                    quickSteps.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                )}
            >
                {quickSteps.map((step) => (
                    <div
                        key={step.number}
                        className="group relative -m-2 flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-brand-light/40 dark:hover:bg-surface-muted"
                    >
                        <QuickStepBadge number={step.number} />
                        <div className="relative z-0 min-w-0 flex-1 pt-0.5 pointer-events-none">
                            <h3 className="flex items-center gap-1.5 text-body-1 font-semibold text-n-800 transition-colors group-hover:text-brand-normal dark:text-n-0">
                                {step.title}
                                {step.external && (
                                    <ArrowTopRightOnSquareIcon
                                        className="size-3.5 shrink-0 text-n-300 dark:text-n-60"
                                        aria-hidden
                                    />
                                )}
                            </h3>
                            <p className="text-body-2 text-n-300 dark:text-n-60 mt-1">
                                {step.subtitle}
                            </p>
                        </div>
                        {step.external ? (
                            <a
                                href={step.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 z-10 rounded-md"
                                aria-label={`${step.title}: ${step.subtitle}`}
                            />
                        ) : (
                            <Link
                                to={step.href}
                                className="absolute inset-0 z-10 rounded-md"
                                aria-label={`${step.title}: ${step.subtitle}`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default IntialStepsSection;
