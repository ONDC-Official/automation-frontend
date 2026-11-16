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

describe("resolveEnvPlaceholders — session tokens", () => {
    const PROD = "https://workbench.ondc.tech/api-service";
    const DEV = "https://dev-workbench.ondc.tech/api-service";
    const trv11 = { domain: "ONDC:TRV11", version: "2.0.0" };
    const sessionSchema = () => ({
        properties: {
            bpp_id: { type: "string", default: "{{SESSION_BPP_ID}}" },
            bpp_uri: { type: "string", default: "{{SESSION_BPP_URI}}" },
            bap_id: { type: "string", default: "{{SESSION_BAP_ID}}" },
            bap_uri: { type: "string", default: "{{SESSION_BAP_URI}}" },
        },
    });

    it("uses the external BPP's own URL when the user plays BPP", () => {
        const result = resolveEnvPlaceholders(sessionSchema(), PROD, {
            ...trv11,
            npType: "BPP",
            subscriberUrl: "https://seller.example.com/ondc/trv11/seller",
        });
        expect(result.properties.bpp_uri.default).toBe(
            "https://seller.example.com/ondc/trv11/seller"
        );
        expect(result.properties.bpp_id.default).toBe("seller.example.com");
        expect(result.properties.bap_uri.default).toBe(`${PROD}/ONDC:TRV11/2.0.0/buyer`);
        expect(result.properties.bap_id.default).toBe("workbench.ondc.tech");
    });

    it("drops the port from the id", () => {
        const result = resolveEnvPlaceholders(sessionSchema(), PROD, {
            ...trv11,
            npType: "BPP",
            subscriberUrl: "https://seller.example.com:8443/cb",
        });
        expect(result.properties.bpp_uri.default).toBe("https://seller.example.com:8443/cb");
        expect(result.properties.bpp_id.default).toBe("seller.example.com");
    });

    it("uses the workbench seller URL when the user plays BAP", () => {
        const context = {
            ...trv11,
            npType: "BAP",
            subscriberUrl: "https://buyer.example.com/ondc/trv11/buyer",
        };
        const prod = resolveEnvPlaceholders(sessionSchema(), PROD, context);
        expect(prod.properties.bpp_uri.default).toBe(`${PROD}/ONDC:TRV11/2.0.0/seller`);
        expect(prod.properties.bpp_id.default).toBe("workbench.ondc.tech");
        expect(prod.properties.bap_uri.default).toBe("https://buyer.example.com/ondc/trv11/buyer");
        expect(prod.properties.bap_id.default).toBe("buyer.example.com");

        const dev = resolveEnvPlaceholders(sessionSchema(), DEV, context);
        expect(dev.properties.bpp_uri.default).toBe(`${DEV}/ONDC:TRV11/2.0.0/seller`);
        expect(dev.properties.bpp_id.default).toBe("dev-workbench.ondc.tech");
    });

    it("falls back to workbench URLs without a session role (playground)", () => {
        const result = resolveEnvPlaceholders(sessionSchema(), PROD, trv11);
        expect(result.properties.bpp_uri.default).toBe(`${PROD}/ONDC:TRV11/2.0.0/seller`);
        expect(result.properties.bap_uri.default).toBe(`${PROD}/ONDC:TRV11/2.0.0/buyer`);
    });

    it("leaves the user-side tokens and warns when the subscriber URL is invalid", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const result = resolveEnvPlaceholders(sessionSchema(), PROD, {
            ...trv11,
            npType: "BPP",
            subscriberUrl: "not a url",
        });
        expect(result.properties.bpp_uri.default).toBe("{{SESSION_BPP_URI}}");
        expect(result.properties.bpp_id.default).toBe("{{SESSION_BPP_ID}}");
        expect(result.properties.bap_id.default).toBe("workbench.ondc.tech");
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});
