import { SVGProps } from "react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import SupportTerminal from "@/assets/svgs/SupportTerminal";
import HomeTerminal from "@/assets/svgs/HomeTerminal";

const Terminal = ({ ...rest }: SVGProps<SVGSVGElement>) => {
    const { pathname } = useLocation();

    if (pathname === ROUTES.SUPPORT) {
        return <SupportTerminal {...rest} />;
    }

    return <HomeTerminal {...rest} />;
};

export default Terminal;
