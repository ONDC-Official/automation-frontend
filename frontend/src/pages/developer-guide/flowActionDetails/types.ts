export type AttributeKind = "attribute" | "enum" | "tag";

export interface ActionAttributesBase {
    jsonPath: string;
    kind: AttributeKind;
}

export interface EnumRef {
    label: string;
    href: string;
}

export interface AttributeDetails extends ActionAttributesBase {
    kind: "attribute";
    required: string;
    owner: string;
    type: string;
    description: string;
    /** Description from x-attributes node; prefer this for display. */
    _description?: { info?: string };
    /** External enum references (e.g. spreadsheet links) for enum-typed attributes. */
    enumRefs?: EnumRef[];
}

export interface EnumOption {
    code: string;
    description: string;
}

export interface EnumDetails extends ActionAttributesBase {
    kind: "enum";
    enums: string[];
    /** Possible values from x-attributes (by useCaseId) or legacy x-enum (code + description) */
    enumOptions?: EnumOption[];
    /** Attribute info from x-attributes (by useCaseId, shown alongside enum) */
    required?: string;
    owner?: string;
    type?: string;
    description?: string;
    /** External enum references (e.g. spreadsheet links) for enum-typed attributes. */
    enumRefs?: EnumRef[];
}

/** Tag list item; can nest to n levels via list. */
export interface TagFieldItem {
    code: string;
    description: string;
    list?: TagFieldItem[];
}

export interface TagField {
    label: string;
    description: string;
    /** Possible values from x-attributes (by useCaseId) or legacy x-tags list; items can nest to n levels */
    list?: TagFieldItem[];
}

export interface AttributeInfo {
    required: string;
    owner: string;
    type: string;
    description: string;
}

export interface TagDetails extends ActionAttributesBase {
    kind: "tag";
    description: string;
    tagFields: TagField[];
    /** Type and description from x-attributes; type should be "tag". */
    _description?: { type?: string; info?: string };
    /** Attribute section from x-attributes (by useCaseId, shown separately) */
    attributeInfo?: AttributeInfo;
}

export type ActionAttributes = AttributeDetails | EnumDetails | TagDetails;

/** Flattened validation rule for display (from x-validations). */
export interface ValidationRuleDisplay {
    name: string;
    description: string;
    attr?: string;
    returnMessage: string;
    reg?: string[];
    valid?: string[];
    domain?: string[];
    version?: string[];
    continue?: string;
}

export type FlowActionDetailsTab = "documentation" | "ai-driven";
