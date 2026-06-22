import { FC } from "react";
import { Card, CardContent } from "@/components/Shadcn/Card/card";
import SectionLabel from "@/components/SectionLabel";
import { supportHowItWorksSteps } from "@pages/support/constants";

const SupportHowItWorksSection: FC = () => (
    <section className="bg-n-0 py-16 lg:py-20 dark:bg-surface-page">
        <div className="mx-auto px-20">
            <SectionLabel label="// HOW IT WORKS" />
            <h2 className="text-h3 font-bold text-n-800 dark:text-n-0 mb-10">
                Getting help is simple.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportHowItWorksSteps.map((step) => (
                    <Card key={step.number} variant="muted" className="items-center text-center">
                        <CardContent className="flex flex-col items-center p-0">
                            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-brand-light text-h5 font-bold text-brand-normal dark:bg-brand-dark/30 dark:text-brand-light">
                                {step.number}
                            </span>
                            <p className="text-caption-1 font-semibold uppercase tracking-widest text-brand-normal mb-2">
                                {step.eyebrow}
                            </p>
                            <h3 className="text-h6 font-bold text-n-800 dark:text-n-0 mb-2">
                                {step.title}
                            </h3>
                            <p className="text-body-2 text-n-300 dark:text-n-60">
                                {step.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </section>
);

export default SupportHowItWorksSection;
