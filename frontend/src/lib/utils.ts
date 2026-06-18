import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                "text-h1",
                "text-h2",
                "text-h3",
                "text-h4",
                "text-h5",
                "text-h6",
                "text-body-1",
                "text-body-2",
                "text-caption-1",
                "text-caption",
                "text-caption-2",
            ],
        },
    },
});

/**
 * Merges Tailwind class names with conflict resolution.
 *
 * @param inputs - Class values to combine
 * @returns A single deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
