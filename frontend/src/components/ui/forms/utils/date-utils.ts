import { format, isValid, parse } from "date-fns";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const parseDateOnly = (value: string): Date | undefined => {
    if (!value || !DATE_ONLY_PATTERN.test(value)) {
        return undefined;
    }

    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
};

export const formatDateOnly = (date: Date): string => format(date, "yyyy-MM-dd");

export const parseDateTimeLocal = (value: string): { date: string; time: string } => {
    if (!value) {
        return { date: "", time: "" };
    }

    if (DATE_TIME_LOCAL_PATTERN.test(value)) {
        const [date, time] = value.split("T");
        return { date, time };
    }

    if (DATE_ONLY_PATTERN.test(value)) {
        return { date: value, time: "" };
    }

    const parsed = new Date(value);
    if (!isValid(parsed)) {
        return { date: "", time: "" };
    }

    return {
        date: formatDateOnly(parsed),
        time: format(parsed, "HH:mm"),
    };
};

export const formatDateTimeLocal = (date: string, time: string): string => {
    if (!date) {
        return "";
    }

    if (!time) {
        return date;
    }

    const normalizedTime = time.length === 5 ? time : time.slice(0, 5);
    return `${date}T${normalizedTime}`;
};

export const isIsoDateTime = (value: string): boolean => value.includes("T");

export const toPayloadIso = (
    value: string,
    options: {
        fieldType?: "date" | "datetime-local" | "text";
        payloadField?: string;
    } = {}
): string => {
    const { fieldType, payloadField = "" } = options;

    if (!value) {
        return value;
    }

    if (fieldType === "datetime-local" || fieldType === "date") {
        return new Date(value).toISOString();
    }

    if (payloadField.includes("timestamp") || payloadField.includes("time.")) {
        if (!isIsoDateTime(value)) {
            return `${value}T00:00:00Z`;
        }
        return value;
    }

    if (DATE_ONLY_PATTERN.test(value) || DATE_TIME_LOCAL_PATTERN.test(value)) {
        return new Date(value).toISOString();
    }

    return value;
};

export const formatFormFieldForPayload = (
    value: string,
    fieldConfig: { type?: string; payloadField?: string }
): string | number => {
    const payloadField = fieldConfig.payloadField;
    if (!payloadField) {
        return value;
    }

    if (payloadField.includes("count") || payloadField.includes("quantity")) {
        return parseInt(value, 10) || 0;
    }

    if (fieldConfig.type === "datetime-local" || fieldConfig.type === "date") {
        return value ? toPayloadIso(value, { fieldType: fieldConfig.type }) : value;
    }

    if (payloadField.includes("timestamp") || payloadField.includes("time.")) {
        return toPayloadIso(value, { payloadField });
    }

    return value;
};
