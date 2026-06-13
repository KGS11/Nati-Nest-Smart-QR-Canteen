import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { ApiErrorResponse, ClientApiError } from "@/types/api";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

const isCustomerPath = (config: InternalAxiosRequestConfig): boolean => {
  const url = config.url;
  if (!url) return false;
  if (url.startsWith("/customer")) return true;
  if (url.startsWith("/feedback") && !url.includes("analytics")) return true;
  if (url.startsWith("/payments") && !url.includes("pending")) return true;
  if (url === "/catering/leads" && config.method?.toLowerCase() === "post") return true;
  return false;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isCustomer = isCustomerPath(config);

    if (isCustomer) {
      const customerToken = useSessionStore.getState().sessionToken;
      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
        return config;
      }
    }

    const staffToken = useAuthStore.getState().token;
    if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
      return config;
    }

    const customerToken = useSessionStore.getState().sessionToken;
    if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "An unexpected error occurred.";
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && !originalRequest?._retry) {
      const authState = useAuthStore.getState();

      if (authState.refreshToken) {
        originalRequest._retry = true;
        try {
          const refreshResponse = await apiClient.post("/auth/refresh", {
            refreshToken: authState.refreshToken,
          });
          const { token, refreshToken, user } = refreshResponse.data.data;
          authState.login(token, user, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (_refreshError) {
          useAuthStore.getState().logout();
        }
      } else if (useSessionStore.getState().sessionToken) {
        useSessionStore.getState().clearSession();
      }
    }

    const clientError: ClientApiError = {
      status,
      message,
      data: error.response?.data,
    };

    return Promise.reject(clientError);
  },
);

export default apiClient;
