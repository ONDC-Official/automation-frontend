export * from "./main";
export * from "./developerGuide";
export * from "./githubDocs";
export * from "./loadTest";
export * from "./dashboard";
export * from "./engine";

// The normalised error every endpoint above rejects with — callers that branch
// on `status` need it, and reaching into shared/ directly is disallowed.
export type { IAxiosBaseQueryError } from "./shared/axiosBaseQuery";
