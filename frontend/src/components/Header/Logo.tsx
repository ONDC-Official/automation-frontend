import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import LogoIcon from "@/assets/svgs/Logo";

export const Logo = () => (
    <Link to={ROUTES.HOME} className="flex shrink-0 justify-center items-center pt-1">
        <LogoIcon className="h-8 w-full pr-2" />
    </Link>
);
