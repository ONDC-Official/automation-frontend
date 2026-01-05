import { FaRegUser } from "react-icons/fa";
import { UserIconProps } from "./types";

export const UserIcon = ({ user }: UserIconProps) => {
  if (!user.avatarUrl) {
    return (
      <div className="w-10 h-10 rounded-full bg-sky-100 mx-auto mb-4 border flex items-center justify-center">
        <FaRegUser />
      </div>
    );
  }

  return (
    <img
      src={user.avatarUrl}
      alt={`${user.githubId}'s avatar`}
      className="w-10 h-10 rounded-full mx-auto mb-4 border"
    />
  );
};
