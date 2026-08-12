import { useRef } from "react";

/**
 * Holds the last payload an RTK Query endpoint returned, while a new cache key
 * loads.
 *
 * RTK Query keys every page, sort and filter combination separately, so `data`
 * is `undefined` the instant any of them changes. For a table that meant the
 * rows blanked to a skeleton and — because `totalPages` fell to 0, and
 * Pagination renders nothing below 2 pages — the pager unmounted under the
 * user's cursor mid-click, taking the row summary with it. On a slow endpoint
 * that reads as "nothing happened".
 *
 * Keeping the previous payload turns a page change into what it should look
 * like: the same frame and the same controls, with the rows briefly stale.
 * The dashboard's detail sheets already do this by hand with
 * `isLoading && !detail`; this is the same idea for the lists.
 *
 * Writing a ref during render is the documented React pattern for deriving a
 * previous value, and is idempotent under StrictMode's double render.
 */
export function useStableQueryData<T>(data: T | undefined): T | undefined {
    const previous = useRef<T | undefined>(undefined);

    if (data !== undefined) previous.current = data;

    return data ?? previous.current;
}

export default useStableQueryData;
