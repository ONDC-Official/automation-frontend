import { useMemo } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import { flattenTests } from "@pages/protocol-studio/ui/editor/contracts/validations/model";

interface IValidationsFileProps {
    contracts: StudioContracts;
    onSelectApi: (api: string) => void;
    onReveal: (line: number) => void;
}

/**
 * validations.yaml whole: what's in it (tests, groups, reuse, comments), the
 * shared definitions declared at the top (`enums:` / `tags:`), and each api's
 * share of the tests. Definitions are read-only this round.
 */
export const ValidationsFile = ({ contracts, onSelectApi, onReveal }: IValidationsFileProps) => {
    const model = contracts.models.validations;
    const parsed = contracts.files.validations.parsed;
    const perApi = useMemo(
        () =>
            model
                ? model.apis.map((api) => {
                      const all = flattenTests(model.tests.get(api) ?? []);
                      return {
                          api,
                          rules: all.filter((t) => t.kind === "rule").length,
                          groups: all.filter((t) => t.kind === "group").length,
                          shared: all.filter((t) => t.shared).length,
                          broken: all.filter(
                              (t) => t.returnError || t.continueError || t.unknownVars.length
                          ).length,
                          line: model.apiLines.get(api)?.line ?? 1,
                      };
                  })
                : [],
        [model]
    );
    if (!model || !parsed) return <p className="studio-spec-empty">No validations.yaml to show.</p>;
    const { census } = parsed;
    const groups = [...new Set(model.definitions.map((d) => d.group))];

    return (
        <div className="studio-spec-file" data-file="validations">
            <div className="studio-stats">
                {[
                    ["Tests", model.counts.rules],
                    ["Groups", model.counts.groups],
                    ["Apis", model.apis.length],
                    ["Anchors (&)", census.anchors],
                    ["Reuses (*)", census.aliases],
                    ["Comment lines", census.commentLines],
                ].map(([label, value]) => (
                    <div key={label} className="studio-stat">
                        <span className="studio-stat-value">{value}</span>
                        <span className="studio-stat-label">{label}</span>
                    </div>
                ))}
            </div>
            {census.mergeKeys || census.redefinedAnchors.length ? (
                <div className="studio-spec-banner" data-tone="warn">
                    <p>
                        {census.mergeKeys
                            ? `${census.mergeKeys} merge key(s) (<<): build-tools and the compiler read them differently. `
                            : ""}
                        {census.redefinedAnchors.length
                            ? `Anchor(s) defined twice: ${census.redefinedAnchors.join(", ")} (the later one wins for every alias after it).`
                            : ""}
                    </p>
                </div>
            ) : null}

            <section className="studio-spec-section">
                <p className="studio-eyebrow">Apis</p>
                <table className="studio-spec-table">
                    <thead>
                        <tr>
                            <th>api</th>
                            <th>tests</th>
                            <th>groups</th>
                            <th>shared</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {perApi.map((row) => (
                            <tr key={row.api}>
                                <td>
                                    <button
                                        type="button"
                                        className="studio-mono"
                                        onClick={() => onSelectApi(row.api)}
                                    >
                                        {row.api}
                                    </button>
                                </td>
                                <td>{row.rules}</td>
                                <td>{row.groups || ""}</td>
                                <td>{row.shared || ""}</td>
                                <td>
                                    {row.broken ? (
                                        <span className="studio-spec-bad">{row.broken} to fix</span>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="studio-key studio-key-xs ml-2"
                                        onClick={() => onReveal(row.line)}
                                    >
                                        line {row.line}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="studio-spec-section">
                <p className="studio-eyebrow">Shared definitions</p>
                {model.definitions.length === 0 ? (
                    <p className="studio-spec-hint">
                        None. Lists declared once at the top (<code>enums:</code> /{" "}
                        <code>tags:</code>, each anchored) can be reused by every test with{" "}
                        <code>*NAME</code>.
                    </p>
                ) : (
                    groups.map((group) => (
                        <div key={group} className="studio-spec-defs">
                            <p className="studio-spec-hint studio-mono">{group}:</p>
                            {model.definitions
                                .filter((d) => d.group === group)
                                .map((def) => (
                                    <div key={def.name} className="studio-spec-def">
                                        <button
                                            type="button"
                                            className="studio-mono studio-spec-def-name"
                                            onClick={() => onReveal(def.line)}
                                        >
                                            {def.anchor ? `&${def.anchor}` : def.name}
                                        </button>
                                        <span
                                            className="studio-spec-def-values"
                                            title={def.values.join(", ")}
                                        >
                                            {def.values.slice(0, 8).map((v) => (
                                                <code key={v}>{v}</code>
                                            ))}
                                            {def.values.length > 8 ? (
                                                <span>+{def.values.length - 8}</span>
                                            ) : null}
                                        </span>
                                        <span
                                            className="studio-spec-shared"
                                            title="Tests that reuse this list or one of its values"
                                        >
                                            <LinkIcon />
                                            {def.uses + def.valueUses}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ))
                )}
            </section>

            {model.sessionDataLine ? (
                <button
                    type="button"
                    className="studio-key studio-key-sm self-start"
                    onClick={() => onReveal(model.sessionDataLine!)}
                >
                    _SESSION_DATA_ · line {model.sessionDataLine}
                </button>
            ) : null}
        </div>
    );
};

export default ValidationsFile;
