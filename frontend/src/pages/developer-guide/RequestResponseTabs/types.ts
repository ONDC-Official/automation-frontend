/** Display mode toggle shared by RequestTab and ResponseTab. */
export type SchemaView = "schema" | "raw";

/** A single named response example extracted from the OpenAPI spec. */
export interface ResponseExample {
    name: string;
    payload: unknown;
}
