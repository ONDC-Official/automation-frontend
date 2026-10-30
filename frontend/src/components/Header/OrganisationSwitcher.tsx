import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/Shadcn/DropDownMenu/dropdown-menu";
import { useSelectOrganisationMutation } from "@store/api";
import type { IUser } from "@/types/user";
import { cn } from "@/lib/utils";

const orgTextClass = "max-w-full truncate text-xs text-n-300 dark:text-n-60";

/**
 * The organisation under the user's name. With more than one NP Portal
 * organisation it opens a list to switch which one the user works for.
 */
export const OrganisationSwitcher = ({ user, inDrawer }: { user: IUser; inDrawer?: boolean }) => {
    const [selectOrganisation, { isLoading }] = useSelectOrganisationMutation();
    const organisations = user.organisations ?? [];

    if (!user.organisationName) {
        return null;
    }
    if (organisations.length < 2) {
        return (
            <span className={orgTextClass} title={user.organisationName}>
                {user.organisationName}
            </span>
        );
    }

    const handleSelect = async (organisationId: string, organisationName: string) => {
        if (organisationId === user.organisationId) {
            return;
        }
        try {
            await selectOrganisation(organisationId).unwrap();
            toast.success(`Now working for ${organisationName}`, { position: "top-right" });
        } catch {
            toast.error("Could not switch organisation. Please try again.");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={isLoading}
                title={`${user.organisationName} (switch organisation)`}
                className={cn(
                    "flex max-w-full items-center gap-0.5 rounded-sm hover:text-brand-normal focus-visible:outline-2 focus-visible:outline-brand-normal disabled:opacity-60",
                    orgTextClass
                )}
            >
                <span className="truncate">{user.organisationName}</span>
                <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={inDrawer ? "start" : "end"} className="max-w-72">
                <DropdownMenuLabel className="text-caption-1 text-text-secondary">
                    Working for
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organisations.map((org) => {
                    const isSelected = org.organisationId === user.organisationId;
                    return (
                        <DropdownMenuItem
                            key={org.organisationId}
                            onClick={() => handleSelect(org.organisationId, org.organisationName)}
                            className="cursor-pointer"
                        >
                            <Check
                                className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
                                aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate" title={org.organisationName}>
                                {org.organisationName || org.organisationId}
                            </span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
