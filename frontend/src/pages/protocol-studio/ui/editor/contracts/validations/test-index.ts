import {
    flattenTests,
    type ValidationsModel,
} from "@pages/protocol-studio/ui/editor/contracts/validations/model";
import { pathPrefixes } from "@pages/protocol-studio/ui/editor/contracts/validations/paths";

export interface PathTests {
    /** Tests whose `_RETURN_` reads the field. */
    checks: string[];
    /** Tests that only use it to decide whether they apply (`_CONTINUE_`). */
    guards: string[];
}

export interface ApiTestIndex {
    byPath: Map<string, PathTests>;
    /** Tests checking the field or anything under it. */
    below: Map<string, number>;
}

/** Per api: which tests check which payload field, keyed by canonical path. */
export const buildTestIndex = (model: ValidationsModel): Map<string, ApiTestIndex> => {
    const index = new Map<string, ApiTestIndex>();
    for (const [api, tests] of model.tests) {
        const byPath = new Map<string, PathTests>();
        const belowSets = new Map<string, Set<string>>();
        const entry = (path: string) => {
            let found = byPath.get(path);
            if (!found) {
                found = { checks: [], guards: [] };
                byPath.set(path, found);
            }
            return found;
        };
        for (const test of flattenTests(tests)) {
            if (test.kind !== "rule") continue;
            for (const path of test.checks) {
                entry(path).checks.push(test.id);
                for (const prefix of pathPrefixes(path)) {
                    const set = belowSets.get(prefix) ?? new Set<string>();
                    set.add(test.id);
                    belowSets.set(prefix, set);
                }
            }
            for (const path of test.guards) entry(path).guards.push(test.id);
        }
        const below = new Map<string, number>();
        for (const [prefix, set] of belowSets) below.set(prefix, set.size);
        index.set(api, { byPath, below });
    }
    return index;
};
