import {
    formatDateOnly,
    formatDateTimeLocal,
    formatFormFieldForPayload,
    isIsoDateTime,
    parseDateOnly,
    parseDateTimeLocal,
    toPayloadIso,
} from "./date-utils";

describe("date-utils", () => {
    describe("parseDateOnly", () => {
        it("parses yyyy-MM-dd", () => {
            const date = parseDateOnly("2024-06-15");
            expect(date).toBeDefined();
            expect(formatDateOnly(date!)).toBe("2024-06-15");
        });

        it("returns undefined for invalid value", () => {
            expect(parseDateOnly("")).toBeUndefined();
            expect(parseDateOnly("15-06-2024")).toBeUndefined();
        });
    });

    describe("parseDateTimeLocal", () => {
        it("splits datetime-local value", () => {
            expect(parseDateTimeLocal("2024-06-15T14:30")).toEqual({
                date: "2024-06-15",
                time: "14:30",
            });
        });

        it("returns date-only parts when time missing", () => {
            expect(parseDateTimeLocal("2024-06-15")).toEqual({
                date: "2024-06-15",
                time: "",
            });
        });
    });

    describe("formatDateTimeLocal", () => {
        it("combines date and time", () => {
            expect(formatDateTimeLocal("2024-06-15", "14:30")).toBe("2024-06-15T14:30");
        });

        it("returns date when time empty", () => {
            expect(formatDateTimeLocal("2024-06-15", "")).toBe("2024-06-15");
        });
    });

    describe("isIsoDateTime", () => {
        it("detects ISO datetime strings", () => {
            expect(isIsoDateTime("2024-06-15T14:30:00.000Z")).toBe(true);
            expect(isIsoDateTime("2024-06-15")).toBe(false);
        });
    });

    describe("toPayloadIso", () => {
        it("converts date field type to ISO", () => {
            const iso = toPayloadIso("2024-06-15", { fieldType: "date" });
            expect(iso).toBe(new Date("2024-06-15").toISOString());
        });

        it("converts datetime-local field type to ISO", () => {
            const iso = toPayloadIso("2024-06-15T14:30", { fieldType: "datetime-local" });
            expect(iso).toBe(new Date("2024-06-15T14:30").toISOString());
        });

        it("appends midnight Z for timestamp payload fields without T", () => {
            expect(toPayloadIso("2024-06-15", { payloadField: "message.timestamp" })).toBe(
                "2024-06-15T00:00:00Z"
            );
        });

        it("passes through ISO values for timestamp payload fields", () => {
            const value = "2024-06-15T10:00:00.000Z";
            expect(toPayloadIso(value, { payloadField: "time.start" })).toBe(value);
        });

        it("returns empty string unchanged", () => {
            expect(toPayloadIso("", { fieldType: "date" })).toBe("");
        });

        it("converts hotel-style yyyy-mm-dd strings", () => {
            const iso = toPayloadIso("2024-06-15");
            expect(iso).toBe(new Date("2024-06-15").toISOString());
        });
    });

    describe("formatFormFieldForPayload", () => {
        it("parses quantity fields as integers", () => {
            expect(
                formatFormFieldForPayload("3", {
                    type: "text",
                    payloadField: "message.order.quantity",
                })
            ).toBe(3);
        });

        it("matches config-form date branch", () => {
            const iso = formatFormFieldForPayload("2024-06-15", {
                type: "date",
                payloadField: "start_date",
            });
            expect(iso).toBe(new Date("2024-06-15").toISOString());
        });

        it("matches config-form datetime-local branch", () => {
            const iso = formatFormFieldForPayload("2024-06-15T14:30", {
                type: "datetime-local",
                payloadField: "scheduled_at",
            });
            expect(iso).toBe(new Date("2024-06-15T14:30").toISOString());
        });

        it("matches config-form timestamp payloadField branch", () => {
            expect(
                formatFormFieldForPayload("2024-06-15", {
                    type: "text",
                    payloadField: "message.time.timestamp",
                })
            ).toBe("2024-06-15T00:00:00Z");
        });

        it("returns raw value when no payloadField", () => {
            expect(formatFormFieldForPayload("hello", { type: "text" })).toBe("hello");
        });
    });
});
