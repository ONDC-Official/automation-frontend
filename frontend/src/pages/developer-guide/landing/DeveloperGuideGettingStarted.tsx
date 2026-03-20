import { useNavigate } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import gettingStartedContent from "./getting-started.md?raw";
import MdFileRender from "@components/MdFileRender";

const DeveloperGuideGettingStarted = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
            <main className="container mx-auto py-8 space-y-6">
                <div className="flex items-center justify-start mb-2">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.DEVELOPER_GUIDE)}
                        className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                    >
                        Back to Developer Guide
                    </button>
                </div>
                <MdFileRender
                    title="Getting Started"
                    description="This section helps you quickly understand how to explore ONDC protocol flows, starting with the Unified Credit use case."
                    mdData={gettingStartedContent}
                />
            </main>
        </div>
    );
};

export default DeveloperGuideGettingStarted;
