import { useMemo, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@components/Shadcn/Accordion/accordion";
import SearchField from "@components/Shadcn/SearchField";
import { FAQ_ITEMS } from "@components/DomainFlowRunner/constants";
import { GetRequestEndpoint } from "@components/DomainFlowRunner/utils/get-request-endpoint";

export default function FlowHelperTab({
    domain,
    version,
    npType,
}: {
    domain?: string;
    version?: string;
    npType?: string;
}) {
    const [query, setQuery] = useState("");

    const endpoint = GetRequestEndpoint(
        domain || "<DOMAIN>",
        version || "<VERSION>",
        npType || "<BUYER/SELLER>"
    );

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return FAQ_ITEMS;

        return FAQ_ITEMS.filter(
            (item) =>
                item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        );
    }, [query]);

    return (
        <div className="flex h-full flex-col gap-3">
            <SearchField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                containerClassName="w-full"
            />

            <p className="text-caption-1 text-text-secondary">
                Send waiting requests to{" "}
                <code className="rounded bg-brand-light px-1 py-0.5 font-mono text-brand-normal dark:bg-brand-dark/30">
                    {endpoint}
                </code>
            </p>

            <Accordion type="single" collapsible className="flex w-full flex-col gap-2">
                {filteredItems.map((item) => (
                    <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="overflow-hidden rounded-lg border border-n-30 bg-brand-light/30 dark:border-border-default dark:bg-surface-muted"
                    >
                        <AccordionTrigger className="px-4 py-3 text-body-2 font-medium text-text-primary hover:no-underline">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 text-body-2 text-text-secondary">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {filteredItems.length === 0 ? (
                <p className="py-6 text-center text-body-2 text-text-secondary">
                    No matching guide items.
                </p>
            ) : null}
        </div>
    );
}
