import type { OpenAPISpecification, XValidationRule, XValidationTestGroup } from "../types";
import type {
    ActionAttributes,
    AttributeDetails,
    EnumDetails,
    TagDetails,
    TagField,
    TagFieldItem,
    EnumOption,
    ValidationRuleDisplay,
    EnumRef,
} from "./types";

const DASH = "—";

function getAtPath(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== "object") return undefined;
    const parts = path
        .replace(/^\$\.?/, "")
        .split(".")
        .filter(Boolean);
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[p.replace(/\[\d+\]$/, "")];
    }
    return cur;
}

function inferType(value: unknown): string {
    if (value == null) return value === null ? "null" : DASH;
    if (Array.isArray(value)) return "array";
    return typeof value === "object" ? "object" : typeof value;
}

function str(v: unknown, fallback: string): string {
    if (v == null) return fallback;
    return typeof v === "string" ? v : fallback;
}

function normalizePath(p: string): string {
    return p.replace(/^\$\.?/, "").trim() || "";
}

/** use_case_id -> attribute_set[api] -> attribute at path. */
function getAttributeBase(
    xa: OpenAPISpecification["x-attributes"],
    useCaseId: string | undefined,
    actionApi: string
): Record<string, unknown> | undefined {
    if (!xa) return undefined;
    const apiKey = actionApi.replace(/\d+$/, "") || actionApi;

    if (Array.isArray(xa)) {
        const match = useCaseId
            ? xa.find(
                  (item) =>
                      (item as { use_case_id?: string }).use_case_id === useCaseId ||
                      (item as { meta?: { use_case_id?: string } }).meta?.use_case_id === useCaseId
              )
            : undefined;
        const block = match ?? xa[0];
        const attrSet = (block as { attribute_set?: Record<string, unknown> })?.attribute_set;
        return attrSet?.[apiKey] as Record<string, unknown> | undefined;
    }

    const key = useCaseId && useCaseId in xa ? useCaseId : Object.keys(xa)[0];
    const attrSet = key
        ? (xa[key] as { attribute_set?: Record<string, unknown> })?.attribute_set
        : undefined;
    return attrSet?.[apiKey] as Record<string, unknown> | undefined;
}

/**
 * Extract owner, required (mandatory), type, description from x-attributes.
 * Path: use_case_id -> attribute_set[api] -> path (or path._description).
 */
function getAttributeInfo(
    attrBase: Record<string, unknown> | undefined,
    path: string,
    value: unknown
): { owner: string; required: string; type: string; description: string } {
    const fallback = { owner: DASH, required: DASH, type: inferType(value), description: DASH };
    if (!attrBase || !path) return fallback;

    const node = getAtPath(attrBase, path) as Record<string, unknown> | undefined;
    const descPath = path ? `${path}._description` : "_description";
    const descNode = (getAtPath(attrBase, descPath) ?? node?._description ?? node?._desciption) as
        | Record<string, unknown>
        | undefined;
    const src =
        descNode && typeof descNode === "object" && !Array.isArray(descNode) ? descNode : node;
    if (!src || typeof src !== "object") return fallback;

    const required = src.required != null ? String(src.required) : DASH;
    const description = src.info != null ? String(src.info) : str(src.description, DASH);

    return {
        owner: str(src.owner, DASH),
        required,
        type: str(src.type, inferType(value)),
        description,
    };
}

function getDescFromNode(node: Record<string, unknown>): string {
    const d = node._description ?? node._desciption ?? node.description;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "info" in d)
        return String((d as { info?: unknown }).info ?? DASH);
    return DASH;
}

/** Map a raw tag list item to TagFieldItem; recursively maps nested list to n levels. */
function mapTagListItem(raw: Record<string, unknown>): TagFieldItem {
    const code = String(raw.code ?? "");
    const description = getDescFromNode(raw) || DASH;
    const rawList = raw.list;
    const list: TagFieldItem[] | undefined = Array.isArray(rawList)
        ? (rawList as Record<string, unknown>[]).map((l) => mapTagListItem(l))
        : undefined;
    return { code, description, ...(list && list.length > 0 ? { list } : undefined) };
}

function isEnumArr(v: unknown): v is { code: string; description?: string }[] {
    return (
        Array.isArray(v) && v.length > 0 && typeof (v[0] as { code?: unknown })?.code === "string"
    );
}

function isTagArr(
    v: unknown
): v is { code: string; description?: string; list?: { code: string; description?: string }[] }[] {
    return (
        Array.isArray(v) && v.length > 0 && typeof (v[0] as { code?: unknown })?.code === "string"
    );
}

function isXAttrEnum(v: unknown): v is {
    type?: string;
    enums?: Array<{ code: string; description?: string; _description?: { info?: string } }>;
    _description?: { type?: string; enums?: Array<{ code: string; description?: string }> };
} {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    const o = v as Record<string, unknown>;
    const desc = o._description as Record<string, unknown> | undefined;
    const type = (o.type ?? desc?.type) as string | undefined;
    const enums = (o.enums ?? desc?.enums) as
        | Array<{ code: string; description?: string }>
        | undefined;
    return type === "enum" && Array.isArray(enums) && enums.length > 0;
}

function isXAttrTags(v: unknown): v is {
    tags: Array<{
        code: string;
        _description?: { info?: string };
        list?: Array<{ code: string; _description?: { info?: string } }>;
    }>;
    _description?: {
        tags?: Array<{
            code: string;
            _description?: { info?: string };
            list?: Array<{ code: string; _description?: { info?: string } }>;
        }>;
        info?: string;
    };
} {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    const o = v as Record<string, unknown>;
    // Check for tags directly or inside _description
    const hasDirectTags = Array.isArray(o.tags) && o.tags.length > 0;
    if (hasDirectTags) return true;

    const desc = o._description;
    if (desc && typeof desc === "object") {
        const descObj = desc as Record<string, unknown>;
        const hasNestedTags = Array.isArray(descObj.tags) && (descObj.tags as unknown[]).length > 0;
        if (hasNestedTags) return true;
    }
    return false;
}

function getEnumRefsFromNode(node: Record<string, unknown> | undefined): EnumRef[] | undefined {
    if (!node) return undefined;

    const desc = node._description as Record<string, unknown> | undefined;
    const raw = (node.enumRefs as unknown) ?? (desc?.enumRefs as unknown);

    if (!Array.isArray(raw) || raw.length === 0) return undefined;

    const refs: EnumRef[] = [];
    for (const r of raw as Array<{ label?: unknown; href?: unknown }>) {
        if (!r || typeof r !== "object") continue;
        const href = typeof r.href === "string" ? r.href : undefined;
        if (!href) continue;
        const label = typeof r.label === "string" && r.label.trim().length > 0 ? r.label : href;
        refs.push({ label, href });
    }

    return refs.length > 0 ? refs : undefined;
}

export function getActionAttributes(
    spec: OpenAPISpecification | null | undefined,
    actionApi: string,
    jsonPath: string,
    value: unknown,
    useCaseId?: string
): ActionAttributes {
    const path = normalizePath(jsonPath);
    const xa = spec?.["x-attributes"];
    const attrBase = getAttributeBase(xa, useCaseId, actionApi);
    const attrVal = attrBase ? (getAtPath(attrBase, path) as Record<string, unknown>) : undefined;
    const attr = getAttributeInfo(attrBase, path, value);
    const enumRefs = attrVal ? getEnumRefsFromNode(attrVal) : undefined;

    const emptyAttr = (): AttributeDetails => ({
        kind: "attribute",
        jsonPath: path || DASH,
        required: attr.required,
        owner: attr.owner,
        type: attr.type,
        description: attr.description,
    });

    if (!path) return { ...emptyAttr(), jsonPath: DASH };

    // 1. x-attributes enum (type/enums can be at top level or under _description)
    if (isXAttrEnum(attrVal)) {
        const desc = attrVal._description as Record<string, unknown> | undefined;
        const enums = (attrVal.enums ?? desc?.enums) as
            | Array<{
                  code: string;
                  description?: string;
                  _description?: { info?: string };
              }>
            | undefined;
        const enumOptions: EnumOption[] = (enums ?? []).map((e) => ({
            code: e.code,
            description:
                (e._description && typeof e._description === "object" && "info" in e._description
                    ? String((e._description as { info?: string }).info)
                    : e.description) || DASH,
        }));
        return {
            kind: "enum",
            jsonPath: path,
            enums: (enums ?? []).map((e) => e.code),
            enumOptions,
            required: attr.required,
            owner: attr.owner,
            type: attr.type || "enum",
            description: attr.description,
            enumRefs,
        } satisfies EnumDetails;
    }

    // 2. x-attributes tags

    if (isXAttrTags(attrVal)) {
        // Tags can be directly on attrVal or inside attrVal._description
        const tagsArray =
            attrVal.tags ??
            (attrVal._description &&
            typeof attrVal._description === "object" &&
            Array.isArray((attrVal._description as Record<string, unknown>).tags)
                ? ((attrVal._description as Record<string, unknown>).tags as Array<{
                      code: string;
                      _description?: { info?: string };
                      list?: Array<{ code: string; _description?: { info?: string } }>;
                  }>)
                : undefined);

        if (!tagsArray) {
            return emptyAttr();
        }

        const tagFields: TagField[] = tagsArray.map((t) => {
            const node = t as Record<string, unknown>;
            const rawList = node.list;
            const list: TagFieldItem[] | undefined = Array.isArray(rawList)
                ? (rawList as Record<string, unknown>[]).map((l) => mapTagListItem(l))
                : undefined;
            return {
                label: String(node.code ?? ""),
                description: getDescFromNode(node),
                ...(list && list.length > 0 ? { list } : undefined),
            };
        });

        // Extract description from _description.info if available
        const _desc = attrVal._description;
        const info =
            _desc && typeof _desc === "object" && "info" in _desc
                ? typeof (_desc as { info?: unknown }).info === "string"
                    ? (_desc as { info: string }).info
                    : undefined
                : undefined;

        return {
            kind: "tag",
            jsonPath: path,
            description: DASH,
            _description: { type: "tag", ...(info && { info }) },
            tagFields,
            attributeInfo: attr,
        } satisfies TagDetails;
    }

    // 3. x-attributes plain attribute (has _description or path._description)
    if (attrVal && typeof attrVal === "object") {
        const _desc = attrVal._description ?? attrVal._desciption;
        const info =
            _desc && typeof _desc === "object" && "info" in _desc
                ? typeof (_desc as { info?: unknown }).info === "string"
                    ? (_desc as { info: string }).info
                    : undefined
                : undefined;
        return {
            kind: "attribute",
            jsonPath: path,
            required: attr.required,
            owner: attr.owner,
            type: attr.type,
            description: attr.description,
            ...(info && { _description: { info } }),
            ...(enumRefs && { enumRefs }),
        } satisfies AttributeDetails;
    }

    // 4. Fallback: x-enum
    const xe = spec?.["x-enum"] as Record<string, Record<string, unknown>> | undefined;
    const enumVal = xe?.[actionApi] ? getAtPath(xe[actionApi], path) : undefined;
    if (isEnumArr(enumVal)) {
        const enumOptions: EnumOption[] = enumVal.map((e) => ({
            code: e.code,
            description: (e.description as string) || DASH,
        }));
        return {
            kind: "enum",
            jsonPath: path,
            enums: enumOptions.map((e) => e.code),
            enumOptions,
            required: attr.required,
            owner: attr.owner,
            type: attr.type,
            description: attr.description,
            enumRefs,
        } satisfies EnumDetails;
    }

    // 5. Fallback: x-tags
    const xt = spec?.["x-tags"] as Record<string, Record<string, unknown>> | undefined;
    const tagVal = xt?.[actionApi] ? getAtPath(xt[actionApi], path) : undefined;
    if (isTagArr(tagVal)) {
        const tagFields: TagField[] = (tagVal as Record<string, unknown>[]).map((t) => {
            const rawList = t.list;
            const list: TagFieldItem[] | undefined = Array.isArray(rawList)
                ? (rawList as Record<string, unknown>[]).map((l) => mapTagListItem(l))
                : undefined;
            return {
                label: String(t.code ?? ""),
                description: getDescFromNode(t),
                ...(list && list.length > 0 ? { list } : undefined),
            };
        });
        return {
            kind: "tag",
            jsonPath: path,
            description: DASH,
            _description: { type: "tag" },
            tagFields,
            attributeInfo: attr,
        } satisfies TagDetails;
    }

    return emptyAttr();
}

function flattenValidationRules(
    rules: XValidationRule[] | undefined,
    groupDescription: string,
    out: ValidationRuleDisplay[]
): void {
    if (!Array.isArray(rules)) return;
    for (const r of rules) {
        const name = (r._NAME_ != null ? String(r._NAME_) : "") || DASH;
        const returnVal = r._RETURN_;
        if (typeof returnVal === "string") {
            out.push({
                name,
                description: groupDescription,
                attr: r.attr,
                returnMessage: returnVal,
                reg: Array.isArray(r.reg) ? r.reg : undefined,
                valid: Array.isArray(r.valid) ? r.valid : undefined,
                domain: Array.isArray(r.domain) ? r.domain : undefined,
                version: Array.isArray(r.version) ? r.version : undefined,
                continue: r._CONTINUE_ != null ? String(r._CONTINUE_) : undefined,
            });
        } else if (Array.isArray(returnVal)) {
            flattenValidationRules(returnVal, groupDescription, out);
        }
    }
}

export function getValidationsForAction(
    spec: OpenAPISpecification | null | undefined,
    actionApi: string,
    jsonPath?: string | null
): ValidationRuleDisplay[] {
    const xv = spec?.["x-validations"];
    if (!xv || typeof xv !== "object") return [];
    const tests = xv["_TESTS_"];
    if (!tests || typeof tests !== "object") return [];
    const groups = tests[actionApi];
    if (!Array.isArray(groups)) return [];

    const normalizedPath = jsonPath ? normalizePath(jsonPath) : null;
    const out: ValidationRuleDisplay[] = [];

    for (const group of groups as XValidationTestGroup[]) {
        const groupDescription =
            (group._DESCRIPTION_ != null ? String(group._DESCRIPTION_) : "") || DASH;
        flattenValidationRules(group._RETURN_ ?? [], groupDescription, out);
    }

    if (normalizedPath) {
        return out.filter((r) => r.attr != null && normalizePath(r.attr) === normalizedPath);
    }
    return out;
}
