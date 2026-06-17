import { cn } from "@/lib/utils";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import { Input } from "@/components/Shadcn/TextField/input";
import { ISearchFieldProps } from "@/components/Shadcn/SearchField/types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const SearchField = ({
    label,
    id,
    className,
    containerClassName,
    placeholder = "Search",
    ...inputProps
}: ISearchFieldProps) => {
    const fieldId = id ?? inputProps.name ?? "search-field";

    const input = (
        <div className={cn("relative min-w-[200px]", containerClassName)}>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-n-80 dark:text-n-60" />
            <Input
                id={fieldId}
                type="text"
                placeholder={placeholder}
                className={cn(
                    "rounded-lg border-n-40 bg-white py-2 pl-9 pr-3 text-n-700 shadow-none placeholder:text-n-80 focus-visible:border-brand-normal focus-visible:ring-2 focus-visible:ring-brand-light dark:border-border-default dark:bg-surface-muted dark:text-n-20",
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
