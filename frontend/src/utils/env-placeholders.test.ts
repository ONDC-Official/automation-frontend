import { resolveEnvPlaceholders } from "./env-placeholders";

const schemaWithTokens = () => ({
    type: "object",
    properties: {
        bpp_id: { type: "string", default: "{{API_SERVICE_HOST}}" },
        bpp_uri: {
            type: "string",
            default: "{{API_SERVICE_URL}}/ONDC:TRV11/2.0.0/seller",
            description: "bpp_uri must follow a valid ONDC seller app identifier format",
        },
        vehicle_category: { type: "string", enum: ["METRO"], default: "METRO" },
    },
    required: ["bpp_id", "bpp_uri"],
});

describe("resolveEnvPlaceholders", () => {
    it("fills dev workbench values", () => {
        const result = resolveEnvPlaceholders(
            schemaWithTokens(),
            "https://dev-workbench.ondc.tech/api-service"
        );
        expect(result.properties.bpp_id.default).toBe("dev-workbench.ondc.tech");
        expect(result.properties.bpp_uri.default).toBe(
            "https://dev-workbench.ondc.tech/api-service/ONDC:TRV11/2.0.0/seller"
        );
    });

    it("fills prod values and strips a trailing slash", () => {
        const result = resolveEnvPlaceholders(
            schemaWithTokens(),
            "https://workbench.ondc.tech/api-service/"
        );
        expect(result.properties.bpp_id.default).toBe("workbench.ondc.tech");
        expect(result.properties.bpp_uri.default).toBe(
            "https://workbench.ondc.tech/api-service/ONDC:TRV11/2.0.0/seller"
        );
    });

    it("works for any domain and side", () => {
        const result = resolveEnvPlaceholders(
            { default: "{{API_SERVICE_URL}}/ONDC:RET10/1.2.5/buyer" },
            "https://workbench.ondc.tech/api-service"
        );
        expect(result.default).toBe(
            "https://workbench.ondc.tech/api-service/ONDC:RET10/1.2.5/buyer"
        );
    });

    it("returns a schema without tokens unchanged", () => {
        const schema = { type: "object", properties: { a: { type: "string", default: "x" } } };
        expect(resolveEnvPlaceholders(schema, "https://workbench.ondc.tech/api-service")).toBe(
            schema
        );
    });

    it("leaves tokens in place and warns when the base URL is missing or invalid", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const schema = schemaWithTokens();
        expect(resolveEnvPlaceholders(schema, undefined)).toBe(schema);
        expect(resolveEnvPlaceholders(schema, "not a url")).toBe(schema);
        expect(warn).toHaveBeenCalledTimes(2);
        warn.mockRestore();
    });

    it("does not mutate the input schema", () => {
        const schema = schemaWithTokens();
        resolveEnvPlaceholders(schema, "https://workbench.ondc.tech/api-service");
        expect(schema.properties.bpp_id.default).toBe("{{API_SERVICE_HOST}}");
    });
});
