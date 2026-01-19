import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { apiClient, ApiError } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { LoginCredentials, PayloadData } from "@pages/db-back-office/types";
import { AxiosError } from "axios";

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

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const response = await apiClient.get<{ authenticated: boolean }>(API_ROUTES.DB.ADMIN_AUTH, {
          params: {
            username: credentials.username,
            password: credentials.password,
          },
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          toast.success("Login successful!");
        } else {
          toast.error("Invalid credentials");
        }
      } catch (error: unknown) {
        toast.error((error as AxiosError<ApiError>).response?.data?.message || (error as Error).message || "Login failed");
        console.error("Authentication error:", error as Error );
      } finally {
        setIsLoading(false);
      }
    },
    [credentials],
  );

  const fetchPayloadData = useCallback(async () => {
    if (!fetchParams.domain || !fetchParams.version) {
      toast.error("Domain and Version are required");
      return;
    }

    setIsLoading(true);
    try {
      const url = API_ROUTES.DB.PAYLOADS(fetchParams.domain, fetchParams.version, fetchParams.action, fetchParams.page);

      const response = await apiClient.get(url);
      setPayloadData({
        domain: fetchParams.domain,
        version: fetchParams.version,
        page: fetchParams.page,
        data: response.data,
      });
      toast.success("Data fetched successfully!");
    } catch (error: unknown) {
      toast.error((error as AxiosError<ApiError>).response?.data?.message || (error as Error).message || "Failed to fetch data");
      console.error("Fetch error:", error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchParams]);

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
