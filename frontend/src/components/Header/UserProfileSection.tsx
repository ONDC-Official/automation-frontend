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
                <span className="mr-2 text-sm md:text-base text-gray-700 mb-2">
                    <strong>{userDetails.githubId}</strong>
                </span>
            ) : (
                <span className="mr-2 text-sm md:text-base text-gray-700 mb-2">
                    <strong>login</strong>
                </span>
            )}

            <GuideOverlay
                currentStep={GuideStepsEnums.Reg1}
                right={0}
                top={55}
                instruction="Step 1: Go to your Profile"
                handleGoClick={onLoginClick}
            >
                <button
                    onClick={onLoginClick}
                    className="mt-2 text-xl"
                    title={userDetails ? "Profile" : "Login"}
                >
                    {userDetails ? (
                        <UserIcon user={userDetails} />
                    ) : (
                        <div className="w-10 h-10 rounded-full shadow-sm bg-sky-100 mx-auto mb-4 text-gray-700 flex items-center justify-center">
                            <FiLogIn />
                        </div>
                    )}
                </button>
            </GuideOverlay>
        </div>
    );
};
