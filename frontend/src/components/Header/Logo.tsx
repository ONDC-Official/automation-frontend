import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import LogoIcon from "@/assets/svgs/Logo";

export const Logo = () => (
    <Link to={ROUTES.HOME} className="flex shrink-0 items-center">
        <LogoIcon className="h-7 w-full pr-2" />
    </Link>
);
