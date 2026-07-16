import {
    Accordion as ShadCnAccordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@components/Shadcn/Accordion/accordion";
import { IAccordionProps } from "@components/Shadcn/Accordion/types";

/**
 * Collapsible accordion that renders a list of guide steps.
 */
const Accordion = ({ title, steps }: IAccordionProps) => (
    <div className="h-full flex flex-col bg-n-0 border border-n-30 rounded-2xl overflow-hidden dark:bg-surface-elevated dark:border-border-default">
        <div className="px-6 pt-5 shrink-0">
            <h2 className="text-h5 font-bold text-n-800 dark:text-n-0">{title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 custom-scrollbar">
            <ShadCnAccordion type="single" collapsible className="flex w-full flex-col gap-2">
                {steps.map((step) => (
                    <AccordionItem
                        key={step.key}
                        value={step.key}
                        className="overflow-hidden rounded-lg border-0 bg-brand-light dark:bg-surface-muted"
                    >
                        <AccordionTrigger className="px-4">{step.label}</AccordionTrigger>
                        <AccordionContent className="px-4">
                            {step.descriptionType === "code" ? (
                                <pre className="bg-n-800 text-n-0 p-4 rounded-lg overflow-x-auto text-caption-1 font-mono dark:bg-n-900">
                                    <code>{step.description}</code>
                                </pre>
                            ) : step.descriptionType === "list" && step.items?.length ? (
                                <div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        <ul className="list-disc space-y-1.5 pl-5 text-body-2 text-n-500 dark:text-n-60">
                                            {step.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {step.description ? (
                                        <p className="mt-2 text-body-2 text-n-500 dark:text-n-60">
                                            {step.description}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-body-2 text-n-500 dark:text-n-60">
                                    {step.description}
                                </p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </ShadCnAccordion>
        </div>
    </div>
);

export default Accordion;
