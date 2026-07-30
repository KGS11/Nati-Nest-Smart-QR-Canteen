const productionAppUrl = "https://nati-nest-smart-qr-canteen.vercel.app";
const productionBackendUrl = "https://nati-nest-smart-qr-canteen-production.up.railway.app";

const stripApiSuffix = (url: string) => url.replace(/\/api\/?$/, "");

const getEnv = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (configuredApiUrl ? stripApiSuffix(configuredApiUrl) : productionBackendUrl);

    return {
      apiUrl: `${origin}/api`,
      socketUrl,
      appUrl: origin,
    };
  }

  const developmentOrigin = "http://localhost:3000";
  const developmentBackend = "http://localhost:5000";
  const fallbackOrigin = process.env.NODE_ENV === "production" ? productionAppUrl : developmentOrigin;
  const fallbackBackend = process.env.NODE_ENV === "production" ? productionBackendUrl : developmentBackend;

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || `${fallbackBackend}/api`,
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || stripApiSuffix(process.env.NEXT_PUBLIC_API_URL || fallbackBackend),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin,
  };
};

export const env = {
  get apiUrl() {
    return getEnv().apiUrl;
  },
  get socketUrl() {
    return getEnv().socketUrl;
  },
  get appUrl() {
    return getEnv().appUrl;
  },
};
