import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GuideProvider } from "@context/guide/GuideProvider";

import "./index.css";
import "antd/dist/reset.css";
import "@styles/bubble.css";
import "@styles/flip.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GuideProvider>
        <App />
      </GuideProvider>
    </BrowserRouter>
  </StrictMode>
);
