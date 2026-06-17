import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

const Accordion = ({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) => {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
};

const AccordionItem = ({
    className,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) => {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn("border-b border-n-30 last:border-b-0 dark:border-border-default", className)}
            {...props}
        />
    );
};

const AccordionTrigger = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) => {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    "flex flex-1 items-center justify-between gap-3 py-3 text-left text-body-2 font-medium text-n-800 transition-all hover:text-brand-normal dark:text-n-0 dark:hover:text-brand-light [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDownIcon className="size-4 shrink-0 text-n-500 dark:text-n-60 transition-transform duration-200" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
};

const AccordionContent = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) => {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            {...props}
        >
            <div className={cn("pt-0 pb-4", className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
