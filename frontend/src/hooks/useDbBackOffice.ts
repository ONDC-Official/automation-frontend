import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
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
        const errorMessage =
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data &&
          typeof error.response.data.message === "string"
            ? error.response.data.message
            : error &&
                typeof error === "object" &&
                "message" in error &&
                typeof error.message === "string"
              ? error.message
              : "Login failed";
        toast.error(errorMessage);
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [credentials]
  );

  const fetchPayloadData = useCallback(async () => {
    if (!fetchParams.domain || !fetchParams.version) {
      toast.error("Domain and Version are required");
      return;
    }

    setIsLoading(true);
    try {
      const url = API_ROUTES.DB.PAYLOADS(
        fetchParams.domain,
        fetchParams.version,
        fetchParams.action,
        fetchParams.page
      );

      const response = await apiClient.get(url);
      setPayloadData({
        domain: fetchParams.domain,
        version: fetchParams.version,
        page: fetchParams.page,
        data: response.data,
      });
      toast.success("Data fetched successfully!");
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : error &&
              typeof error === "object" &&
              "message" in error &&
              typeof error.message === "string"
            ? error.message
            : "Failed to fetch data";
      toast.error(errorMessage);
      console.error("Fetch error:", error);
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
