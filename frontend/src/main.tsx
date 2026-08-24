import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initGA } from "@utils/analytics";
import { ROUTES } from "@constants/routes";

import "./index.css";

// `ReactGA.initialize` sends a page view, and GA4 reports `page_location` as
// `document.location.href` — fragment included. The MCP session viewer carries
// an engine token in that fragment, so analytics never starts on that route.
// `index.html` guards its own inline gtag config for the same reason; both are
// needed, because either one alone would still send it.
//
// `trackPageView` is already safe: it sends `pathname + search` and never the
// hash.
if (!window.location.pathname.startsWith(ROUTES.MCP_SESSION)) {
    initGA();
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
