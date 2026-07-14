import { FC, useEffect, useState } from "react";
import { Button } from "@components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";

const HeroInfo: FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // `window.location.href` is a full navigation, so this state survives
        // only via the browser's back-forward cache. `pageshow` fires on both
        // a fresh load and a bfcache restore, so it's the reliable place to
        // clear a "redirecting" flag that a normal re-render can't reach.
        const handlePageShow = () => setIsRedirecting(false);
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    const handleStartBuilding = () => {
        if (user) {
            navigate(ROUTES.SCENARIO);
            return;
        }

        setIsRedirecting(true);
        const backendUrl = import.meta.env.VITE_DEVELOPER_GUIDE_BACKEND_URL;
        window.location.href = `${backendUrl}/login`;
    };

    return (
        <div>
            <h1 className="text-h3 lg:text-h2 font-semibold text-n-800 dark:text-n-60 mb-3">
                <span className="text-brand-normal">ONDC</span> Integration, Simplified!
            </h1>
            <p className="text-h4 font-regular text-n-900 dark:text-n-20 mb-3">
                Validate, Debug, Deploy
            </p>
            <p className="text-body-1 text-n-300 dark:text-n-60 mb-6 max-w-lg">
                Your all-in-one toolkit for seamless ONDC integration. From schema validations to
                testing full flows, get ONDC-ready quicker!
            </p>
            <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={handleStartBuilding} isLoading={isRedirecting}>
                    Start Building
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate(ROUTES.DEVELOPER_GUIDE)}
                >
                    Read Documentation
                </Button>
            </div>
        </div>
    );
};

export default HeroInfo;
