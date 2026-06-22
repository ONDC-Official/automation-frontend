import { FC } from "react";
import { Link } from "react-router-dom";
import { quickSteps } from "@/pages/home/constants";
import { QuickStepBadge } from "@pages/home/QuickStepBadge";

const IntialStepsSection: FC = () => (
    <section className="border-y border-n-30 bg-surface-page dark:border-border-default">
        <div className="mx-auto py-8 px-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                {quickSteps.map((step) => (
                    <div key={step.number} className="group relative flex items-start gap-3">
                        <QuickStepBadge number={step.number} />
                        <div className="relative z-0 min-w-0 flex-1 pt-0.5 pointer-events-none transition-opacity group-hover:opacity-80">
                            <h3 className="text-body-1 font-semibold text-n-800 dark:text-n-0">
                                {step.title}
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
