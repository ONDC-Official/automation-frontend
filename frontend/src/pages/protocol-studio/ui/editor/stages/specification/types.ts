import type { ContractFileId } from "@pages/protocol-studio/ui/editor/contracts/github";

export type SpecFacet = "schema" | "validations" | "flow";
export type SpecMode = "structured" | "source";

/** What the Specification stage shows. Kept by the shell, so it survives switching stages. */
export type SpecSelection =
    | {
          kind: "api";
          api: string;
          facet: SpecFacet;
          mode: SpecMode;
          /** Something to bring into view: a payload path (schema / tests filter), a test, a Source line. */
          focus?: SpecFocus;
      }
    | { kind: "file"; file: ContractFileId; mode: SpecMode; focus?: SpecFocus };

export interface SpecFocus {
    path?: string;
    testId?: string;
    line?: number;
    /** A component schema (whole-file specs). */
    component?: string;
    /** Bumped so focusing the same thing twice still scrolls. */
    nonce: number;
}

/** Which file each facet edits. */
export const FACET_FILE: Record<SpecFacet, ContractFileId> = {
    schema: "specs",
    validations: "validations",
    flow: "actions",
};

let nonce = 0;
export const nextNonce = () => ++nonce;
