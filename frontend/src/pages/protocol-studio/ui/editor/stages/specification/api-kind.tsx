import { FORM_APIS, NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";

export type SpecApiKind = "request" | "callback" | "form";

/** Requests, callbacks and forms, drawn in the Protocol stage's node colours. */
export const specApiKind = (api: string): SpecApiKind =>
    (FORM_APIS as readonly string[]).includes(api) || api.endsWith("_form")
        ? "form"
        : api.startsWith("on_")
          ? "callback"
          : "request";

const KIND_TITLES: Record<SpecApiKind, string> = {
    request: "Request · BAP → BPP",
    callback: "Callback · BPP → BAP",
    form: "Form",
};

/** The coloured square the Protocol stage's node list uses, for an api name. */
export const ApiKindTile = ({ api }: { api: string }) => {
    const kind = specApiKind(api);
    const { Icon } = NODE_KINDS[kind];
    return (
        <span
            className="studio-spec-kind"
            data-kind={kind}
            title={KIND_TITLES[kind]}
            aria-hidden="true"
        >
            <Icon />
        </span>
    );
};
