import { useEffect, useState } from "react";
import type { SchemaView } from "./types";

/**
 * Defers mounting the Schema/Raw JSON panels by one tick so the browser can
 * paint the loading spinner first, instead of blocking on the heavy render.
 * Shared by RequestTab and ResponseTab, which each track their own `view` state.
 */
export function useSchemaViewReadiness(api: string, view: SchemaView) {
    const [rawReady, setRawReady] = useState(false);
    const [schemaReady, setSchemaReady] = useState(false);

    useEffect(() => {
        if (view === "raw") {
            setRawReady(false);
            const id = setTimeout(() => setRawReady(true), 0);
            return () => clearTimeout(id);
        } else {
            setRawReady(false);
        }
    }, [view, api]);

    useEffect(() => {
        setSchemaReady(false);
        const id = setTimeout(() => setSchemaReady(true), 0);
        return () => clearTimeout(id);
    }, [api]);

    return { rawReady, schemaReady };
}
