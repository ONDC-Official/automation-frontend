/** Parse an ISO-8601 duration (P#D / PT#H / PT#M) into a unit + value pair. */
export const parseDuration = (duration: string) => {
    if (!duration) return { unit: "hour", value: "1" };

    const dayMatch = duration.match(/^P(\d+)D$/);
    if (dayMatch) {
        return { unit: "day", value: dayMatch[1] };
    }

    const hourMatch = duration.match(/^PT(\d+)H$/);
    if (hourMatch) {
        return { unit: "hour", value: hourMatch[1] };
    }

    const minuteMatch = duration.match(/^PT(\d+)M$/);
    if (minuteMatch) {
        return { unit: "minute", value: minuteMatch[1] };
    }

    return { unit: "hour", value: "1" };
};

/**
 * Generate the cartesian product of the selected attributes' values, producing
 * one `{ attribute: value }` record per variant combination.
 */
export const generateVariantCombinations = (
    attrs: string[],
    values: { [attribute: string]: string[] },
    index: number = 0
): Record<string, string>[] => {
    if (index >= attrs.length) {
        return [{}];
    }

    const attr = attrs[index];
    const attrValues = values[attr] || [];
    const remainingCombinations = generateVariantCombinations(attrs, values, index + 1);

    const combinations: Record<string, string>[] = [];
    for (const value of attrValues) {
        for (const combo of remainingCombinations) {
            combinations.push({
                ...combo,
                [attr]: value,
            });
        }
    }

    return combinations;
};
