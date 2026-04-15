import { FaRegUser } from "react-icons/fa";
import { UserIconProps } from "./types";

export const UserIcon = ({ user }: UserIconProps) => {
    if (!user.avatarUrl) {
        return (
            <div className="w-9 h-9 rounded-full bg-sky-100 border-2 border-sky-200 hover:border-sky-400 flex items-center justify-center transition-all duration-200 hover:scale-105">
                <FaRegUser className="text-sky-500" />
            </div>
        );
    }

    return (
        <img
            src={user.avatarUrl}
            alt={`${user.githubId}'s avatar`}
            className="w-9 h-9 rounded-full border-2 border-sky-200 hover:border-sky-400 hover:scale-105 transition-all duration-200 object-cover"
        />
    );
};
