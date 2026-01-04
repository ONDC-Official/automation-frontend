import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export const Logo = () => {
  const navigate = useNavigate();

  const handleLogoClick = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  return (
    <div className="flex items-center justify-start w-full md:w-auto cursor-pointer" onClick={handleLogoClick}>
      <img
        src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
        alt="Logo"
        className="h-10 w-auto"
      />
      <pre
        className="text-2xl font-bold text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text ml-1 mb-1"
        style={{
          fontWeight: "1000",
        }}>
        WORKBENCH
      </pre>
    </div>
  );
};
