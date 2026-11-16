import { useEffect, useMemo, useState } from "react";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import { getComponentRoot } from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import { SchemaTree } from "@pages/protocol-studio/ui/editor/stages/specification/schema-tree";

interface ISpecsFileProps {
    contracts: StudioContracts;
    onSelectApi: (api: string) => void;
    /** A component to open first (from a `$ref` chip). */
    component?: string;
    componentNonce?: number;
}

/**
 * openapi.yaml whole: the apis it has request schemas for, and its shared
 * schemas (`components.schemas`) with which apis reach each one.
 */
export const SpecsFile = ({
    contracts,
    onSelectApi,
    component,
    componentNonce,
}: ISpecsFileProps) => {
    const { spec, specApis, refUsers } = contracts.models;
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string | null>(component ?? null);
    useEffect(() => {
        if (component) setSelected(component);
    }, [component, componentNonce]);

    const names = useMemo(() => Object.keys(spec?.components?.schemas ?? {}), [spec]);
    const users = useMemo(
        () => (spec ? refUsers() : new Map<string, Set<string>>()),
        [spec, refUsers]
    );
    const shown = names.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()));
    const root = useMemo(
        () => (spec && selected ? getComponentRoot(spec, selected) : null),
        [spec, selected]
    );

    if (!spec) return <p className="studio-spec-empty">No openapi.yaml to show.</p>;

    return (
        <div className="studio-spec-file" data-file="specs">
            <section className="studio-spec-section">
                <p className="studio-eyebrow">Request schemas · {specApis.length} apis</p>
                <div className="studio-spec-chips">
                    {specApis.map((api) => (
                        <span key={api} className="studio-spec-chip">
                            <button
                                type="button"
                                className="studio-mono"
                                onClick={() => onSelectApi(api)}
                            >
                                {api}
                            </button>
                        </span>
                    ))}
                </div>
            </section>
            <section className="studio-spec-section studio-spec-components">
                <div className="studio-spec-components-list">
                    <input
                        className="bp-input"
                        placeholder={`Search ${names.length} components…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <ul>
                        {shown.map((name) => (
                            <li key={name}>
                                <button
                                    type="button"
                                    className="studio-api-row"
                                    data-used={users.has(name) || undefined}
                                    data-selected={name === selected || undefined}
                                    onClick={() => setSelected(name)}
                                >
                                    <span className="studio-mono truncate">{name}</span>
                                    <span className="studio-text-faint ml-auto text-[11px]">
                                        {users.get(name)?.size
                                            ? `${users.get(name)!.size} apis`
                                            : "unused"}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="studio-spec-components-detail">
                    {root ? (
                        <>
                            <div className="studio-spec-toolbar">
                                <p className="studio-card-title studio-mono min-w-0 flex-1">
                                    {selected}
                                </p>
                                <div className="studio-spec-chips">
                                    {[...(users.get(selected!) ?? [])].map((api) => (
                                        <span key={api} className="studio-spec-chip">
                                            <button
                                                type="button"
                                                className="studio-mono"
                                                onClick={() => onSelectApi(api)}
                                            >
                                                {api}
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <SchemaTree spec={spec} root={root} onRef={setSelected} />
                        </>
                    ) : (
                        <p className="studio-spec-empty">Pick a component to see its fields.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default SpecsFile;
