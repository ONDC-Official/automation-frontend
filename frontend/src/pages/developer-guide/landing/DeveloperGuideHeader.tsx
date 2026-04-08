import { useNavigate } from "react-router-dom";
import { FiChevronRight, FiArrowLeft } from "react-icons/fi";
import { ROUTES } from "@constants/routes";

export default function DeveloperGuideHeader() {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="container mx-auto px-6 h-14 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.HOME)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600 transition-colors duration-150 group"
                    aria-label="Back to Home"
                >
                    <FiArrowLeft
                        size={13}
                        className="group-hover:-translate-x-0.5 transition-transform duration-150"
                    />
                    <span>Home</span>
                </button>
                <FiChevronRight size={13} className="text-gray-300" />
                <span className="text-sm font-semibold text-gray-800">Developer Guide</span>
            </div>
        </header>
    );
}
