import { useEffect, useState } from "react";
import type { GraphExecutorV2, GraphNodeV2 } from "@ondc/automation-mock-runner";

import { isDefaultMatch } from "@pages/protocol-studio/ui/editor/flows/action-files";
import type { FlatGraph, Fork, ProtocolProblem } from "@pages/protocol-studio/ui/editor/types";

/**
 * Checks that the alternatives of every fork can be told apart. For each
 * alternative, its default payload (with `context.action` set to its API)
 * stands in for "a message of this step"; every sibling's `match` is run
 * against it. Exactly one sibling — itself — must accept it:
 *
 * - its own `match` rejecting it is an error (the function is wrong);
 * - a sibling accepting it is an error when either has a written `match`
 *   (sharpen it), and a warning when neither has one yet (two alternatives
 *   share an API and nothing distinguishes them: write `match` for each, or
 *   merge them).
 *
 * Forks whose alternatives have different APIs never overlap: the API is the
 * first filter. Runs after the graph compiles; results are problems.
 */
export const useRecognitionCheck = (
    executor: GraphExecutorV2 | null,
    flat: FlatGraph,
    forks: Fork[]
): { problems: ProtocolProblem[]; checking: boolean } => {
    const [problems, setProblems] = useState<ProtocolProblem[]>([]);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (!executor) {
            setProblems([]);
            return;
        }
        let stale = false;
        setChecking(true);
        (async () => {
            const found: ProtocolProblem[] = [];
            const sessionData = executor.getSessionData(executor.createSession({ mode: "open" }));
            const warned = new Set<string>();
            for (const fork of forks) {
                if (fork.kind !== "alternatives") continue;
                const targets = fork.options
                    .map((option) => executor.getNode(option.target.id))
                    .filter((node): node is GraphNodeV2 => !!node && node.kind !== "decision");
                for (const target of targets) {
                    const sample = sampleOf(target);
                    for (const sibling of targets) {
                        const check = await executor.matchNode(sibling, sample, sessionData);
                        if (stale) return;
                        if (sibling.id === target.id) {
                            if (!check.accepted) {
                                found.push({
                                    id: `recognise:${fork.key}:${target.id}:self`,
                                    level: "error",
                                    message: `${target.id}'s match rejects its own default payload${
                                        check.match && !check.match.success
                                            ? ` (${check.match.error?.message ?? "it threw"})`
                                            : ""
                                    } — an incoming ${target.api} would never be recognised as it`,
                                    nodeId: target.id,
                                });
                            }
                            continue;
                        }
                        if (!check.accepted) continue;
                        const studioTarget = flat.byId.get(target.id);
                        const studioSibling = flat.byId.get(sibling.id);
                        const bothDefault =
                            isDefaultMatch(
                                studioTarget?.files.match,
                                target.api,
                                studioTarget?.codeLanguage
                            ) &&
                            isDefaultMatch(
                                studioSibling?.files.match,
                                sibling.api,
                                studioSibling?.codeLanguage
                            );
                        if (bothDefault) {
                            const pair = [target.id, sibling.id].sort().join("|");
                            if (warned.has(pair)) continue;
                            warned.add(pair);
                            found.push({
                                id: `recognise:${fork.key}:${pair}:same-api`,
                                level: "warning",
                                message: `${target.id} and ${sibling.id} are alternatives after ${fork.nodeId} with the same API (${target.api}) and no match — an incoming ${target.api} can't be told apart: write match for each, or merge them`,
                                nodeId: fork.nodeId,
                            });
                        } else {
                            found.push({
                                id: `recognise:${fork.key}:${target.id}:${sibling.id}`,
                                level: "error",
                                message: `${sibling.id}'s match also accepts ${target.id}'s payload — after ${fork.nodeId} an incoming ${target.api} is ambiguous: sharpen ${sibling.id}'s match (or ${target.id}'s payload), or merge the two`,
                                nodeId: sibling.id,
                            });
                        }
                    }
                }
            }
            if (stale) return;
            setProblems(found);
            setChecking(false);
        })().catch((e: unknown) => {
            if (stale) return;
            setProblems([
                {
                    id: "recognise:failed",
                    level: "warning",
                    message: `Couldn't check recognition: ${e instanceof Error ? e.message : String(e)}`,
                },
            ]);
            setChecking(false);
        });
        return () => {
            stale = true;
        };
    }, [executor, flat, forks]);

    return { problems, checking };
};

/** A node's default payload as a message of its step: `context.action` filled in when absent. */
const sampleOf = (node: GraphNodeV2): unknown => {
    const base =
        node.defaultPayload && typeof node.defaultPayload === "object"
            ? (node.defaultPayload as Record<string, unknown>)
            : {};
    const context =
        base.context && typeof base.context === "object"
            ? (base.context as Record<string, unknown>)
            : {};
    return { ...base, context: { ...context, action: context.action ?? node.api } };
};

export default useRecognitionCheck;
