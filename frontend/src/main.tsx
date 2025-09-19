import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "antd/dist/reset.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import {GuideProvider} from "./context/guideContext"

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<GuideProvider>
				<App />
			</GuideProvider>
		</BrowserRouter>
	</StrictMode>
);
