import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import IconButton from "@components/ui/mini-components/icon-button";
import { ROUTES } from "@constants/routes";

export default function DeveloperGuideHeader() {
    const navigate = useNavigate();

    return (
        <div className="h-16 flex items-center justify-between bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm">
            <div className="flex items-center gap-6 w-full container mx-auto">
                <IconButton
                    icon={<FaArrowLeft size={16} />}
                    label="Back to Home"
                    onClick={() => navigate(ROUTES.HOME)}
                    color="gray"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                    DEVELOPER GUIDE
                </span>
            </div>
        </div>
    );
}
