import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useAdminAuthMutation, useLazyGetPayloadsQuery } from "@store/api";
import { LoginCredentials, PayloadData } from "@pages/db-back-office/types";

type FetchParams = {
    domain: string;
    version: string;
    page: string;
    action: string;
};

export const useDbBackOffice = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: "",
        password: "",
    });
    const [payloadData, setPayloadData] = useState<PayloadData | null>(null);
    const [fetchParams, setFetchParams] = useState<FetchParams>({
        domain: "",
        version: "",
        page: "",
        action: "any",
    });
    const [adminAuth] = useAdminAuthMutation();
    const [triggerGetPayloads] = useLazyGetPayloadsQuery();

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            try {
                const response = await adminAuth(credentials).unwrap();

                if (response.authenticated) {
                    setIsAuthenticated(true);
                    toast.success("Login successful!");
                } else {
                    toast.error("Invalid credentials");
                }
            } catch (error: unknown) {
                toast.error((error as { message?: string }).message || "Login failed");
                console.error("Authentication error:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [credentials, adminAuth]
    );

    const fetchPayloadData = useCallback(async () => {
        if (!fetchParams.domain || !fetchParams.version) {
            toast.error("Domain and Version are required");
            return;
        }

        setIsLoading(true);
        try {
            const result = await triggerGetPayloads(fetchParams);
            if (result.error) throw result.error;
            setPayloadData({
                domain: fetchParams.domain,
                version: fetchParams.version,
                page: fetchParams.page,
                data: result.data,
            });
            toast.success("Data fetched successfully!");
        } catch (error: unknown) {
            toast.error((error as { message?: string }).message || "Failed to fetch data");
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchParams, triggerGetPayloads]);

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        setPayloadData(null);
        setCredentials({ username: "", password: "" });
        setFetchParams({
            domain: "",
            version: "",
            page: "",
            action: "",
        });
    }, []);

    return {
        isAuthenticated,
        isLoading,
        credentials,
        fetchParams,
        payloadData,
        handleLogin,
        fetchPayloadData,
        handleLogout,
        setCredentials,
        setFetchParams,
    };
};
