import * as React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Field, FieldLabel } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

export type SearchFieldProps = Omit<React.ComponentProps<typeof Input>, "id" | "type"> & {
    label?: string;
    id?: string;
    containerClassName?: string;
};

export const SearchField = ({
    label,
    id,
    className,
    containerClassName,
    placeholder = "Search",
    ...inputProps
}: SearchFieldProps) => {
    const fieldId = id ?? inputProps.name ?? "search-field";

    const input = (
        <div className={cn("relative min-w-[200px]", containerClassName)}>
            <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-n-80"
                aria-hidden
            />
            <Input
                id={fieldId}
                type="text"
                placeholder={placeholder}
                className={cn(
                    "rounded-lg border-n-40 bg-white py-2 pl-9 pr-3 text-n-700 shadow-none placeholder:text-n-80 focus-visible:border-brand-normal focus-visible:ring-2 focus-visible:ring-brand-light",
                    className
                )}
                {...inputProps}
            />
        </div>
    );

    if (!label) {
        return input;
    }

    return (
        <Field>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            {input}
        </Field>
    );
};

export default SearchField;
