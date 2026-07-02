import { useCallback, useState } from "react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { apiClient, ApiError } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectFrameworkHealthAuthenticated,
    setFrameworkHealthAuthenticated,
} from "@store/slices/frameworkHealthSlice";

export interface VersionResult {
    version: string;
    usecases: string[];
    status: number | null;
    healthy: boolean;
    error?: string;
}

export interface DomainResult {
    domain: string;
    versions: VersionResult[];
}

export interface HealthSummary {
    totalChecked: number;
    totalHealthy: number;
    totalUnhealthy: number;
}

export interface HealthReportData {
    status: string;
    message: string;
    summary: HealthSummary;
    results: DomainResult[];
}

export const useFrameworkHealth = () => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectFrameworkHealthAuthenticated);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [isRunning, setIsRunning] = useState(false);
    const [report, setReport] = useState<HealthReportData | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsAuthLoading(true);
            try {
                const response = await apiClient.get<{ authenticated: boolean }>(
                    API_ROUTES.DB.ADMIN_AUTH,
                    {
                        params: {
                            username: credentials.username,
                            password: credentials.password,
                        },
                    }
                );
                if (response.data.authenticated) {
                    dispatch(setFrameworkHealthAuthenticated(true));
                    toast.success("Login successful!");
                } else {
                    toast.error("Invalid credentials");
                }
            } catch (error: unknown) {
                toast.error(
                    (error as AxiosError<ApiError>).response?.data?.message ||
                        (error as Error).message ||
                        "Login failed"
                );
            } finally {
                setIsAuthLoading(false);
            }
        },
        [credentials, dispatch]
    );

    const handleLogout = useCallback(() => {
        dispatch(setFrameworkHealthAuthenticated(false));
        setReport(null);
        setCredentials({ username: "", password: "" });
    }, [dispatch]);

    const runApiServiceCheck = useCallback(async () => {
        setIsRunning(true);
        setReport(null);
        try {
            // Use axios directly so we can set a long timeout (5 min) for this potentially slow call
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
            const response = await axios.get<HealthReportData>(
                `${backendUrl}${API_ROUTES.HEALTH.API_SERVICE}`,
                {
                    timeout: 5 * 60 * 1000, // 5 minutes
                    withCredentials: true,
                }
            );
            setReport(response.data);
            setLastChecked(new Date());
            toast.success("Health check completed!");
        } catch (error: unknown) {
            const msg =
                (error as AxiosError<ApiError>).response?.data?.message ||
                (error as Error).message ||
                "Health check failed";
            toast.error(msg);
            console.error("Framework health check error:", error);
        } finally {
            setIsRunning(false);
        }
    }, []);

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
