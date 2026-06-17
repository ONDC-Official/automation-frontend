import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { Button } from "@/components/Shadcn/Button/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/Shadcn/DropDownMenu/dropdown-menu";
import { IUserProfileMenu } from "@components/Header/types";
import { ArrowLeftStartOnRectangleIcon, UserIcon } from "@heroicons/react/20/solid";

export const Avatar = ({ user, onLogout }: IUserProfileMenu) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="size-9 w-9 rounded-full p-0 hover:bg-transparent focus-visible:ring-0"
                title="Account menu"
            >
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={`${user.githubId}'s avatar`}
                        className="size-9 rounded-full border-2 border-sky-200 object-cover transition-all duration-200 hover:scale-105 hover:border-sky-400"
                    />
                ) : (
                    <div className="flex size-9 items-center justify-center rounded-full border-2 border-sky-200 bg-sky-100 transition-all duration-200 hover:scale-105 hover:border-sky-400">
                        <UserIcon className="size-5 text-sky-500" />
                    </div>
                )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-30">
            <DropdownMenuItem asChild>
                <Link to={ROUTES.PROFILE} className="flex items-center gap-2 cursor-pointer">
                    <UserIcon className="size-4" />
                    Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={onLogout}
                className="text-error-500 focus:text-brand-normal [&_svg]:text-error-500 cursor-pointer"
            >
                <ArrowLeftStartOnRectangleIcon className="size-4" />
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default Avatar;
