import { FC } from "react";
import { Button } from "@components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { isDevGuideEnabled } from "@/types/environment";

const HeroInfo: FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { startLogin, isLoginRedirecting } = useGitHubLogin();

    const handleStartBuilding = () => {
        if (user) {
            navigate(ROUTES.SCENARIO);
            return;
        }

        startLogin(ROUTES.SCENARIO);
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
                <Button size="lg" onClick={handleStartBuilding} isLoading={isLoginRedirecting}>
                    Start Building
                </Button>
                {isDevGuideEnabled ? (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate(ROUTES.DEVELOPER_GUIDE)}
                    >
                        Read Documentation
                    </Button>
                ) : null}
            </div>
        </div>
    );
};

export default HeroInfo;
