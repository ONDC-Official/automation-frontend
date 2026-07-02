import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAdminAuthMutation, useLazyGetApiServiceHealthQuery } from "@store/api";
import type { IVersionResult, IDomainResult, IHealthSummary, IHealthReportData } from "@store/api";

export type VersionResult = IVersionResult;
export type DomainResult = IDomainResult;
export type HealthSummary = IHealthSummary;
export type HealthReportData = IHealthReportData;

const SESSION_KEY = "framework_health_auth";

export const useFrameworkHealth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
        () => sessionStorage.getItem(SESSION_KEY) === "true"
    );
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [isRunning, setIsRunning] = useState(false);
    const [report, setReport] = useState<HealthReportData | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [adminAuth] = useAdminAuthMutation();
    const [triggerGetApiServiceHealth] = useLazyGetApiServiceHealthQuery();

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsAuthLoading(true);
            try {
                const response = await adminAuth(credentials).unwrap();
                if (response.authenticated) {
                    setIsAuthenticated(true);
                    sessionStorage.setItem(SESSION_KEY, "true");
                    toast.success("Login successful!");
                } else {
                    toast.error("Invalid credentials");
                }
            } catch (error: unknown) {
                toast.error((error as { message?: string }).message || "Login failed");
            } finally {
                setIsAuthLoading(false);
            }
        },
        [credentials, adminAuth]
    );

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(SESSION_KEY);
        setReport(null);
        setCredentials({ username: "", password: "" });
    }, []);

    const runApiServiceCheck = useCallback(async () => {
        setIsRunning(true);
        setReport(null);
        try {
            const result = await triggerGetApiServiceHealth();
            if (result.error) throw result.error;
            setReport(result.data ?? null);
            setLastChecked(new Date());
            toast.success("Health check completed!");
        } catch (error: unknown) {
            const msg = (error as { message?: string }).message || "Health check failed";
            toast.error(msg);
            console.error("Framework health check error:", error);
        } finally {
            setIsRunning(false);
        }
    }, [triggerGetApiServiceHealth]);

    return {
        isAuthenticated,
        isAuthLoading,
        credentials,
        setCredentials,
        handleLogin,
        handleLogout,
        isRunning,
        report,
        lastChecked,
        runApiServiceCheck,
    };
};
