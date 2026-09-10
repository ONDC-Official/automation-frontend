import { useEffect, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@components/Shadcn/Button";

import { injectDefaultStyles } from "./mock-dynamic-form";

/**
 * Multi-entry variant of MockDynamicForm for `html_form_multi` steps
 * (mime_type text/html-multi): renders one copy of the raw form HTML per
 * entry (e.g. per family member), with add/remove controls and a single
 * submit that merges every entry's values into arrays:
 *   { firstName: ["a", "b"], ... }
 * Hidden inputs are submitted once (scalar, from the first entry) — they are
 * plumbing (form ids etc.), not per-member data.
 */
export default function MockDynamicFormMulti({
    htmlForm,
    onSubmit,
}: {
    htmlForm: string;
    onSubmit: (formData: Record<string, unknown>) => void;
}) {
    // Monotonic keys so removing an entry doesn't remount its siblings.
    const [entryKeys, setEntryKeys] = useState<number[]>([0]);
    const nextKey = useRef(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const addEntry = () => {
        setEntryKeys((prev) => [...prev, nextKey.current++]);
    };

    const removeEntry = (key: number) => {
        setEntryKeys((prev) => (prev.length > 1 ? prev.filter((k) => k !== key) : prev));
    };

    const handleSubmit = () => {
        const container = containerRef.current;
        if (!container) return;

        const forms = Array.from(container.querySelectorAll("form"));
        if (forms.length === 0) return;

        // Native validation per entry, so `required` on the seller form still applies.
        for (const form of forms) {
            if (!form.reportValidity()) return;
        }

        const merged: Record<string, unknown> = {};
        const hiddenNames = new Set<string>();
        forms[0]
            .querySelectorAll<HTMLInputElement>('input[type="hidden"]')
            .forEach((el) => el.name && hiddenNames.add(el.name));

        forms.forEach((form, index) => {
            const data = new FormData(form);
            data.forEach((value, key) => {
                if (hiddenNames.has(key)) {
                    if (index === 0) merged[key] = value;
                    return;
                }
                if (!Array.isArray(merged[key])) merged[key] = [];
                (merged[key] as unknown[]).push(value);
            });
        });

        onSubmit(merged);
    };

    return (
        <div ref={containerRef} className="space-y-4">
            {entryKeys.map((key, index) => (
                <FormEntry
                    key={key}
                    index={index}
                    htmlForm={htmlForm}
                    canRemove={entryKeys.length > 1}
                    onRemove={() => removeEntry(key)}
                />
            ))}

            <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" className="gap-1" onClick={addEntry}>
                    <PlusIcon className="size-4" />
                    Add Entry
                </Button>
                <Button type="button" onClick={handleSubmit}>
                    Submit {entryKeys.length > 1 ? `(${entryKeys.length} entries)` : ""}
                </Button>
            </div>
        </div>
    );
}

function FormEntry({
    index,
    htmlForm,
    canRemove,
    onRemove,
}: {
    index: number;
    htmlForm: string;
    canRemove: boolean;
    onRemove: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) return;
        host.innerHTML = htmlForm;
        const formElement = host.querySelector("form");
        if (formElement) {
            injectDefaultStyles(formElement);
            // One shared submit lives outside the entries — hide per-entry submits
            // and block native submission (values are collected by the parent).
            formElement.addEventListener("submit", (e) => e.preventDefault());
            formElement
                .querySelectorAll<HTMLElement>(
                    'button[type="submit"], input[type="submit"], button:not([type])'
                )
                .forEach((el) => {
                    el.style.display = "none";
                });
        }
    }, [htmlForm]);

    return (
        <div className="rounded-lg border border-border-default p-3">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-secondary">Entry {index + 1}</span>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive"
                        onClick={onRemove}
                    >
                        <TrashIcon className="size-4" />
                        Remove
                    </Button>
                )}
            </div>
            <div ref={ref} />
        </div>
    );
}
