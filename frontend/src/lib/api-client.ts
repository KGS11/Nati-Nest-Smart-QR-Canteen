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

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "An unexpected error occurred.";

    if (status === 401) {
      if (useAuthStore.getState().token) {
        useAuthStore.getState().logout();
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
