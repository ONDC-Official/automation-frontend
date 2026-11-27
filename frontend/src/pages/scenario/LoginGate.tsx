import { useState, type ReactNode } from "react";
import { LogIn, Lock } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import { useLoginLabel } from "@hooks/useLoginLabel";
import SavedConfigsIcon from "@assets/svgs/SavedConfigsIcon";
import SessionsReportsIcon from "@assets/svgs/SessionsReportsIcon";
import ReuseConfigsIcon from "@assets/svgs/ReuseConfigsIcon";

/** What logging in gives you, shown under the login prompt. */
const LOGIN_BENEFITS = [
    {
        icon: SavedConfigsIcon,
        title: "Saved Configs",
        description: "Your saved configs show up here, ready to launch.",
    },
    {
        icon: SessionsReportsIcon,
        title: "Sessions & Reports",
        description: "Sessions and reports are linked to your organisation.",
    },
    {
        icon: ReuseConfigsIcon,
        title: "Reuse Configs",
        description: "Save configs to your profile and reuse them.",
    },
];

export interface ILoginGateState {
    /** The visitor chose "Continue without login" (their sessions get no account or organisation). */
    isGuest: boolean;
    /** Back to the login prompt. */
    leaveGuest: () => void;
}

interface ILoginGateProps {
    isLoggedOut: boolean;
    isLoginRedirecting: boolean;
    onLogin: () => void;
    children: (state: ILoginGateState) => ReactNode;
    /**
     * Optional: let the page own the "continue without login" state (e.g. from the
     * URL, so browser Back leaves the guest form). Without these, the gate keeps it.
     */
    isGuest?: boolean;
    onContinueWithoutLogin?: () => void;
    onLeaveGuest?: () => void;
}

/**
 * Shows logged-out visitors a login prompt in place of the new-session form.
 * They can still continue without logging in; those sessions have no userId
 * or organisation. Only shown once the login service confirms NP Portal (ONDC)
 * logins: a GitHub login carries no organisation, and if the provider is
 * unknown the login button may not work either.
 */
export const LoginGate = ({
    isLoggedOut,
    isLoginRedirecting,
    onLogin,
    children,
    isGuest: controlledIsGuest,
    onContinueWithoutLogin,
    onLeaveGuest,
}: ILoginGateProps) => {
    const [ownIsGuest, setOwnIsGuest] = useState(false);
    const { provider, label } = useLoginLabel();
    const continueWithoutLogin = controlledIsGuest ?? ownIsGuest;
    const leaveGuest = onLeaveGuest ?? (() => setOwnIsGuest(false));
    const startGuest = onContinueWithoutLogin ?? (() => setOwnIsGuest(true));

    if (!isLoggedOut || provider !== "ondc") {
        return children({ isGuest: false, leaveGuest });
    }

    if (continueWithoutLogin) {
        return children({ isGuest: true, leaveGuest });
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-n-30 bg-n-0 px-6 py-16 text-center dark:border-border-default dark:bg-surface-elevated sm:py-20">
                <span className="flex size-20 items-center justify-center rounded-full bg-brand-light text-brand-normal dark:bg-surface-muted">
                    <Lock className="size-8" aria-hidden="true" />
                </span>
                <div className="max-w-2xl space-y-2">
                    <h2 className="text-h5 font-bold text-text-primary">
                        Log in to run your tests
                    </h2>
                    <p className="text-body-1 text-text-secondary">
                        Log in with your NP Portal account to launch sessions from your configs in
                        one click.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <Button
                        size="lg"
                        onClick={onLogin}
                        isLoading={isLoginRedirecting}
                        className="gap-2"
                    >
                        <LogIn className="size-5" aria-hidden="true" />
                        {label}
                    </Button>
                    <button
                        type="button"
                        onClick={startGuest}
                        className="rounded text-body-2 font-medium text-brand-normal underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/40"
                    >
                        Continue without login
                    </button>
                </div>
            </div>

            <ul
                aria-label="Why log in"
                className="grid divide-y divide-n-30 rounded-2xl border border-n-30 bg-n-0 dark:divide-border-default dark:border-border-default dark:bg-surface-elevated md:grid-cols-3 md:divide-x md:divide-y-0"
            >
                {LOGIN_BENEFITS.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex items-center gap-4 px-6 py-5">
                        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-brand-light-active bg-brand-light text-brand-normal dark:border-brand-normal/40 dark:bg-brand-normal/15">
                            <Icon className="size-10" />
                        </span>
                        <span className="space-y-1">
                            <span className="block text-body-1 font-semibold text-text-primary">
                                {title}
                            </span>
                            <span className="block text-body-2 text-text-secondary">
                                {description}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
