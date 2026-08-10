import { Activity } from "lucide-react";
import Card, {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@pages/business-dashboard/components/Card";
import { Button } from "@components/Shadcn/Button";
import FormPasswordInput from "@pages/business-dashboard/components/FormPasswordInput";
import { useLogin } from "@pages/business-dashboard/hooks/useAuth";
import { APP_NAME, APP_TAGLINE } from "@pages/business-dashboard/constants";

/**
 * Shown in place of the dashboard when the session cookie is missing or stale.
 *
 * Rendered inline rather than as a `/business/login` route: the workbench
 * already owns `/login` for GitHub OAuth, and gating in place means a deep link
 * into a filtered session list survives signing in. The server enforces the
 * session independently — every /dashboard data route sits behind
 * requireDashboardSession, whatever the client chooses to render.
 */
const AuthGate = () => {
    const { register, onSubmit, errors, isSubmitting } = useLogin();

    return (
        <div className="flex h-full items-center justify-center p-4">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center gap-2.5">
                    <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
                        <Activity className="size-4" />
                    </span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-base font-semibold">{APP_NAME}</span>
                        <span className="text-muted-foreground text-xs">{APP_TAGLINE}</span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Sign in</CardTitle>
                        <CardDescription>
                            The dashboard uses a single shared password. Your session is a
                            server-side cookie — no API key ever reaches this browser.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                            <FormPasswordInput
                                label="Dashboard password"
                                autoComplete="current-password"
                                autoFocus
                                error={errors.password?.message}
                                registration={register("password", {
                                    required: "Enter the dashboard password",
                                })}
                            />

                            {errors.root?.message && (
                                <p role="alert" className="text-status-fail-ink text-sm">
                                    {errors.root.message}
                                </p>
                            )}

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Signing in…" : "Sign in"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AuthGate;
