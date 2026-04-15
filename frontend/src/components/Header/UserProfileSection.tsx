import { FiLogIn } from "react-icons/fi";
import { GuideStepsEnums } from "@context/guideContext";
import GuideOverlay from "@components/ui/GuideOverlay";
import { UserDetails } from "./types";
import { UserIcon } from "./UserIcon";

interface UserProfileSectionProps {
    userDetails: UserDetails | undefined;
    onLoginClick: () => void;
}

export const UserProfileSection = ({ userDetails, onLoginClick }: UserProfileSectionProps) => {
    return (
        <div className="relative flex items-center">
            {userDetails ? (
                <span className="mr-3 text-sm font-semibold text-gray-700 hidden md:inline">
                    {userDetails.username}
                </span>
            ) : null}

            <GuideOverlay
                currentStep={GuideStepsEnums.Reg1}
                right={0}
                top={55}
                instruction="Step 1: Go to your Profile"
                handleGoClick={onLoginClick}
            >
                <button
                    onClick={onLoginClick}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1 rounded-full transition-all duration-200"
                    title={userDetails ? "Profile" : "Login"}
                >
                    {userDetails ? (
                        <UserIcon user={userDetails} />
                    ) : (
                        <div className="h-9 flex items-center gap-1.5 border border-sky-300 text-sky-600 bg-sky-50 rounded-full px-4 text-sm font-medium hover:bg-sky-100 hover:border-sky-500 transition-all duration-200">
                            <FiLogIn className="text-base" />
                            <span>Login</span>
                        </div>
                    )}
                </button>
            </GuideOverlay>
        </div>
    );
};
