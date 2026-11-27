import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Building2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/Shadcn/DropDownMenu/dropdown-menu";
import { useAuth } from "@hooks/useAuth";
import { organisationLabel, useActiveOrganisation } from "@hooks/useActiveOrganisation";

/**
 * After logging in, a user who belongs to several organisations picks the one they
 * are working for. It can't be skipped: sessions and configs depend on it. Users
 * with one organisation never see it (that one is used).
 */
export const OrganisationPickerDialog = () => {
    const { organisations, needsChoice, setActiveOrganisation } = useActiveOrganisation();
    const { isAuthLoading } = useAuth();
    const location = useLocation();
    // Wait until the login has fully settled (code exchanged, profile loaded): opening
    // mid-login can leave the page unclickable when the pop-up closes.
    const isLoginSettling = isAuthLoading || new URLSearchParams(location.search).has("code");
    const open = needsChoice && !isLoginSettling;

    // Safety net: once closed, make sure the page is clickable again (the pop-up turns
    // clicks off on the page while open) unless another pop-up is still open.
    const wasOpen = useRef(false);
    useEffect(() => {
        if (open) {
            wasOpen.current = true;
            return;
        }
        if (!wasOpen.current) return;
        wasOpen.current = false;
        const timer = window.setTimeout(() => {
            if (!document.querySelector("[role=dialog]")) {
                document.body.style.pointerEvents = "";
            }
        }, 400);
        return () => window.clearTimeout(timer);
    }, [open]);

    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                className="max-w-[calc(100%-2rem)] gap-5 sm:max-w-md"
            >
                <DialogHeader>
                    <DialogTitle className="text-h6 font-bold">
                        Choose your organisation
                    </DialogTitle>
                    <DialogDescription className="text-body-2 text-text-secondary">
                        Your configs, sessions and reports follow the organisation you pick. You can
                        switch any time from the top bar.
                    </DialogDescription>
                </DialogHeader>
                <ul className="space-y-2" aria-label="Your organisations">
                    {organisations.map((org) => (
                        <li key={org.organisationId}>
                            <button
                                type="button"
                                onClick={() => setActiveOrganisation(org.organisationId)}
                                className="flex w-full items-center gap-3 rounded-xl border border-n-30 bg-n-0 px-4 py-3 text-left transition-colors hover:border-brand-light-active hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50 dark:border-border-default dark:bg-surface-elevated dark:hover:bg-brand-normal/15"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-normal dark:bg-brand-normal/15">
                                    <Building2 className="size-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-body-1 font-semibold text-text-primary">
                                    {organisationLabel(org)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    );
};

/**
 * The organisation in the top bar. With several organisations it is a menu to
 * switch; with one it is plain text. Nothing for logins without organisations.
 */
export const OrganisationSwitcher = ({ className }: { className?: string }) => {
    const { organisations, activeOrganisation, setActiveOrganisation } = useActiveOrganisation();
    if (organisations.length === 0) return null;

    const name = organisationLabel(activeOrganisation) || "Choose organisation";
    const textClass = "max-w-full truncate text-xs text-n-300 dark:text-n-60";

    if (organisations.length === 1) {
        return (
            <span className={cn(textClass, className)} title={name}>
                {name}
            </span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Organisation: ${name}. Switch organisation`}
                className={cn(
                    textClass,
                    "flex items-center gap-1 rounded hover:text-brand-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50",
                    className
                )}
            >
                <span className="truncate" title={name}>
                    {name}
                </span>
                <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>Switch organisation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organisations.map((org) => {
                    const isActive = org.organisationId === activeOrganisation?.organisationId;
                    return (
                        <DropdownMenuItem
                            key={org.organisationId}
                            onSelect={() => setActiveOrganisation(org.organisationId)}
                            className="gap-2"
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {organisationLabel(org)}
                            </span>
                            {isActive ? (
                                <Check className="size-4 text-brand-normal" aria-label="Current" />
                            ) : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
