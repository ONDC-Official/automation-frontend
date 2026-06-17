import { useMemo, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/Shadcn/Accordion/accordion";
import SearchField from "@/components/Shadcn/SearchField";
import { GetRequestEndpoint } from "@components/FlowShared/guides";

const FAQ_ITEMS = [
    {
        id: "faq1",
        question: 'What does "Waiting" status mean?',
        answer: 'The "Waiting" status indicates that this API is expecting you to send a request to the specified endpoint. The flow will not proceed until this request is made.',
    },
    {
        id: "faq2",
        question: "Why can't I use the same transaction_id for different flows?",
        answer: "Each flow represents a unique transaction. Using the same transaction_id would cause conflicts and make it impossible to distinguish between different flow executions. Always use a unique transaction_id for each new flow.",
    },
    {
        id: "faq3",
        question: "What happens to my data when I delete a flow?",
        answer: "Deleting a flow permanently removes all associated data, including requests, responses, and metadata. This action cannot be undone. If you need to retry, you must start with a new, different transaction_id.",
    },
    {
        id: "faq4",
        question: "When should APIs have the same message_id?",
        answer: "APIs should share the same message_id only when they are displayed as pairs (typically a request-response pair). All other APIs in your flow should have unique message_ids to maintain proper tracking.",
    },
    {
        id: "faq5",
        question: "Can I start a new flow without stopping the current one?",
        answer: "No, you must manually stop the current flow before starting a new one. This ensures data integrity and prevents conflicts between concurrent flows.",
    },
    {
        id: "faq6",
        question: "How do I disable validations?",
        answer: "Click the settings icon in the Info section, then adjust validation options and click Save.",
    },
    {
        id: "faq7",
        question: "When can I generate a report?",
        answer: "You can generate a report at any point during or after flow execution. The report will contain all available data up to that moment and will automatically open in a new view.",
    },
];

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
                <p className="py-6 text-center text-body-2 text-text-secondary">No matching guide items.</p>
            ) : null}
        </div>
    );
}
