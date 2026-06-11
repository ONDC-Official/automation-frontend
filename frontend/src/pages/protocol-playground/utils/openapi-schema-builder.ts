import { Schema } from "genson-js";
import { convertToYamlWithRefs } from "json-to-yaml-ref";

/**
 * OpenAPI document builder for the Schema Generator.
 *
 * This is the file to edit when you want to change how the OpenAPI output looks:
 * the hardcoded response schemas, the version selection rule, path/operation
 * shape, and document metadata all live here.
 *
 * We target OpenAPI 3.1.0 because it is a superset of JSON Schema, so the
 * generated request schemas (which can use `type` arrays / `anyOf`) drop in
 * without any conversion.
 */
export const OPENAPI_VERSION = "3.1.0";

export type JsonSchemaObject = Record<string, unknown>;

export interface OpenApiDocument {
    openapi: string;
    info: { title: string; version: string; description?: string };
    paths: Record<string, unknown>;
}

export interface ApiSchemaEntry {
    /** ONDC action name, e.g. "search" — becomes the POST path `/search`. */
    api: string;
    /** Consolidated request-body schema generated from all example payloads. */
    requestSchema: Schema;
    /** Major version char ("1" | "2" | undefined) from context.version / core_version. */
    majorVersion?: string;
}

export interface OpenApiMeta {
    title?: string;
    version?: string;
    description?: string;
}
//---------------
//---------------
// ---------------------------------------------------------------------------
// Hardcoded synchronous (ACK/NACK) response schemas — edit these freely. ____|
// Picked per endpoint by the major version found in its example payloads.    |
// ---------------------------------------------------------------------------
// --------------
// --------------
const ACK_RESPONSE_V2: JsonSchemaObject = {
    type: "object",
    properties: {
        message: {
            type: "object",
            properties: {
                ack: {
                    properties: {
                        status: {
                            enum: ["ACK", "NACK"],
                        },
                        tags: {
                            description:
                                "A list of tags containing any additional information sent along with the Acknowledgement.",
                            type: "array",
                            items: {
                                description:
                                    "A collection of tag objects with group level attributes. For detailed documentation on the Tags and Tag Groups schema go to https://github.com/beckn/protocol-specifications/discussions/316",
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    display: {
                                        description:
                                            "Indicates the display properties of the tag group. If display is set to false, then the group will not be displayed. If it is set to true, it should be displayed. However, group-level display properties can be overriden by individual tag-level display property. As this schema is purely for catalog display purposes, it is not recommended to send this value during search.",
                                        type: "boolean",
                                        default: true,
                                    },
                                    descriptor: {
                                        description:
                                            "Description of the TagGroup, can be used to store detailed information.",
                                        properties: {
                                            name: {
                                                type: "string",
                                            },
                                            code: {
                                                type: "string",
                                            },
                                            short_desc: {
                                                type: "string",
                                            },
                                            long_desc: {
                                                type: "string",
                                            },
                                            additional_desc: {
                                                type: "object",
                                                additionalProperties: false,
                                                properties: {
                                                    url: {
                                                        type: "string",
                                                    },
                                                    content_type: {
                                                        type: "string",
                                                        enum: [
                                                            "text/plain",
                                                            "text/html",
                                                            "application/json",
                                                        ],
                                                    },
                                                },
                                            },
                                            media: {
                                                type: "array",
                                                items: {
                                                    description:
                                                        "This object contains a url to a media file.",
                                                    type: "object",
                                                    additionalProperties: false,
                                                    properties: {
                                                        mimetype: {
                                                            description:
                                                                "indicates the nature and format of the document, file, or assortment of bytes. MIME types are defined and standardized in IETF's RFC 6838",
                                                            type: "string",
                                                        },
                                                        url: {
                                                            description: "The URL of the file",
                                                            type: "string",
                                                            format: "uri",
                                                        },
                                                        signature: {
                                                            description:
                                                                "The digital signature of the file signed by the sender",
                                                            type: "string",
                                                        },
                                                        dsa: {
                                                            description:
                                                                "The signing algorithm used by the sender",
                                                            type: "string",
                                                        },
                                                    },
                                                },
                                            },
                                            images: {
                                                type: "array",
                                                items: {
                                                    description: "Describes an image",
                                                    type: "object",
                                                    additionalProperties: false,
                                                    properties: {
                                                        url: {
                                                            description:
                                                                "URL to the image. This can be a data url or an remote url",
                                                            type: "string",
                                                            format: "uri",
                                                        },
                                                        size_type: {
                                                            description:
                                                                "The size of the image. The network policy can define the default dimensions of each type",
                                                            type: "string",
                                                            enum: [
                                                                "xs",
                                                                "sm",
                                                                "md",
                                                                "lg",
                                                                "xl",
                                                                "custom",
                                                            ],
                                                        },
                                                        width: {
                                                            description:
                                                                "Width of the image in pixels",
                                                            type: "string",
                                                        },
                                                        height: {
                                                            description:
                                                                "Height of the image in pixels",
                                                            type: "string",
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        type: "object",
                                    },
                                    list: {
                                        description:
                                            "An array of Tag objects listed under this group. This property can be set by BAPs during search to narrow the `search` and achieve more relevant results. When received during `on_search`, BAPs must render this list under the heading described by the `name` property of this schema.",
                                        type: "array",
                                        items: {
                                            description:
                                                "Describes a tag. This is used to contain extended metadata. This object can be added as a property to any schema to describe extended attributes. For BAPs, tags can be sent during search to optimize and filter search results. BPPs can use tags to index their catalog to allow better search functionality. Tags are sent by the BPP as part of the catalog response in the `on_search` callback. Tags are also meant for display purposes. Upon receiving a tag, BAPs are meant to render them as name-value pairs. This is particularly useful when rendering tabular information about a product or service.",
                                            type: "object",
                                            additionalProperties: false,
                                            properties: {
                                                descriptor: {
                                                    description:
                                                        "Description of the Tag, can be used to store detailed information.",
                                                    properties: {
                                                        name: {
                                                            type: "string",
                                                        },
                                                        code: {
                                                            type: "string",
                                                        },
                                                        short_desc: {
                                                            type: "string",
                                                        },
                                                        long_desc: {
                                                            type: "string",
                                                        },
                                                        additional_desc: {
                                                            type: "object",
                                                            additionalProperties: false,
                                                            properties: {
                                                                url: {
                                                                    type: "string",
                                                                },
                                                                content_type: {
                                                                    type: "string",
                                                                    enum: [
                                                                        "text/plain",
                                                                        "text/html",
                                                                        "application/json",
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                        media: {
                                                            type: "array",
                                                            items: {
                                                                description:
                                                                    "This object contains a url to a media file.",
                                                                type: "object",
                                                                additionalProperties: false,
                                                                properties: {
                                                                    mimetype: {
                                                                        description:
                                                                            "indicates the nature and format of the document, file, or assortment of bytes. MIME types are defined and standardized in IETF's RFC 6838",
                                                                        type: "string",
                                                                    },
                                                                    url: {
                                                                        description:
                                                                            "The URL of the file",
                                                                        type: "string",
                                                                        format: "uri",
                                                                    },
                                                                    signature: {
                                                                        description:
                                                                            "The digital signature of the file signed by the sender",
                                                                        type: "string",
                                                                    },
                                                                    dsa: {
                                                                        description:
                                                                            "The signing algorithm used by the sender",
                                                                        type: "string",
                                                                    },
                                                                },
                                                            },
                                                        },
                                                        images: {
                                                            type: "array",
                                                            items: {
                                                                description: "Describes an image",
                                                                type: "object",
                                                                additionalProperties: false,
                                                                properties: {
                                                                    url: {
                                                                        description:
                                                                            "URL to the image. This can be a data url or an remote url",
                                                                        type: "string",
                                                                        format: "uri",
                                                                    },
                                                                    size_type: {
                                                                        description:
                                                                            "The size of the image. The network policy can define the default dimensions of each type",
                                                                        type: "string",
                                                                        enum: [
                                                                            "xs",
                                                                            "sm",
                                                                            "md",
                                                                            "lg",
                                                                            "xl",
                                                                            "custom",
                                                                        ],
                                                                    },
                                                                    width: {
                                                                        description:
                                                                            "Width of the image in pixels",
                                                                        type: "string",
                                                                    },
                                                                    height: {
                                                                        description:
                                                                            "Height of the image in pixels",
                                                                        type: "string",
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    type: "object",
                                                },
                                                value: {
                                                    description:
                                                        "The value of the tag. This set by the BPP and rendered as-is by the BAP.",
                                                    type: "string",
                                                },
                                                display: {
                                                    description:
                                                        "This value indicates if the tag is intended for display purposes. If set to `true`, then this tag must be displayed. If it is set to `false`, it should not be displayed. This value can override the group display value.",
                                                    type: "boolean",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    description:
                        "Describes the acknowledgement sent in response to an API call. If the implementation uses HTTP/S, then Ack must be returned in the same session. Every API call to a BPP must be responded to with an Ack whether the BPP intends to respond with a callback or not. This has one property called `status` that indicates the status of the Acknowledgement.",
                    type: "object",
                },
            },
            required: ["ack"],
        },
        error: {
            description:
                "Describes an error object that is returned by a BAP, BPP or BG as a response or callback to an action by another network participant. This object is sent when any request received by a network participant is unacceptable. This object can be sent either during Ack or with the callback.",
            type: "object",
            additionalProperties: false,
            properties: {
                code: {
                    type: "string",
                    description:
                        'Standard error code. For full list of error codes, refer to docs/protocol-drafts/BECKN-005-ERROR-CODES-DRAFT-01.md of this repo"',
                },
                paths: {
                    type: "string",
                    description:
                        "Path to json schema generating the error. Used only during json schema validation errors",
                },
                message: {
                    type: "string",
                    description:
                        "Human readable message describing the error. Used mainly for logging. Not recommended to be shown to the user.",
                },
            },
        },
    },
    required: ["message"],
};

const ACK_RESPONSE_V1: JsonSchemaObject = {
    type: "object",
    properties: {
        context: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                },
                bap_id: {
                    type: "string",
                },
                bap_uri: {
                    type: "string",
                },
                bpp_id: {
                    type: "string",
                },
                bpp_uri: {
                    type: "string",
                },
                city: {
                    type: "string",
                },
                core_version: {
                    type: "string",
                },
                country: {
                    type: "string",
                },
                domain: {
                    type: "string",
                },
                message_id: {
                    type: "string",
                },
                timestamp: {
                    type: "string",
                },
                transaction_id: {
                    type: "string",
                },
                ttl: {
                    type: "string",
                },
            },
        },
        ...(ACK_RESPONSE_V2.properties as Record<string, unknown>),
    },
};

/** Returns the hardcoded sync response schema for the given major version. */
export function getResponseSchemaForVersion(majorVersion?: string): JsonSchemaObject {
    if (majorVersion === "1") return ACK_RESPONSE_V1;
    // default to the 2.x family
    return ACK_RESPONSE_V2;
}

// ---------------------------------------------------------------------------
// OpenAPI assembly
// ---------------------------------------------------------------------------
function buildPostOperation(entry: ApiSchemaEntry) {
    return {
        post: {
            operationId: entry.api,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: entry.requestSchema,
                    },
                },
            },
            responses: {
                "200": {
                    // `description` is required on every OpenAPI Response Object.
                    description: "Synchronous ACK/NACK response",
                    content: {
                        "application/json": {
                            schema: getResponseSchemaForVersion(entry.majorVersion),
                        },
                    },
                },
            },
        },
    };
}

export function buildOpenApiDocument(
    entries: ApiSchemaEntry[],
    meta: OpenApiMeta = {}
): OpenApiDocument {
    const paths: Record<string, unknown> = {};
    for (const entry of entries) {
        paths[`/${entry.api}`] = buildPostOperation(entry);
    }
    return {
        openapi: OPENAPI_VERSION,
        info: {
            title: meta.title ?? "ONDC Generated API",
            version: meta.version ?? "1.0.0",
            ...(meta.description ? { description: meta.description } : {}),
        },
        paths,
    };
}

/**
 * Serializes the OpenAPI document to YAML, collapsing duplicate structures
 * (e.g. the shared response schema) into anchors/aliases.
 */
export function openApiToYaml(doc: OpenApiDocument): string {
    return convertToYamlWithRefs(doc, {
        minSize: 3,
    });
}
