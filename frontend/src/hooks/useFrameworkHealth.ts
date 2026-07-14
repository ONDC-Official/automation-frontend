import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAdminAuthMutation, useLazyGetApiServiceHealthQuery } from "@store/api";
import type { IVersionResult, IDomainResult, IHealthSummary, IHealthReportData } from "@store/api";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectFrameworkHealthAuthenticated,
    setFrameworkHealthAuthenticated,
} from "@store/slices/frameworkHealthSlice";

export type VersionResult = IVersionResult;
export type DomainResult = IDomainResult;
export type HealthSummary = IHealthSummary;
export type HealthReportData = IHealthReportData;

export const useFrameworkHealth = () => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectFrameworkHealthAuthenticated);
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
                    dispatch(setFrameworkHealthAuthenticated(true));
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
        [credentials, adminAuth, dispatch]
    );

    const handleLogout = useCallback(() => {
        dispatch(setFrameworkHealthAuthenticated(false));
        setReport(null);
        setCredentials({ username: "", password: "" });
    }, [dispatch]);

    const runApiServiceCheck = useCallback(async () => {
        setIsRunning(true);
        try {
            const result = await triggerGetApiServiceHealth();
            if (result.error) throw result.error;
            setReport(result.data ?? null);
            setLastChecked(new Date());
            toast.success("Health check completed!");
        } catch (error: unknown) {
            const { status, data } = (error ?? {}) as {
                status?: number | string;
                data?: { message?: string };
            };
            toast.error(
                `Health check failed (${status ?? "unknown"}): ${data?.message ?? "please try again"}`
            );
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
