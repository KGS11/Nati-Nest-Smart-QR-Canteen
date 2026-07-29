const getEnv = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    return {
      apiUrl: `${origin}/api`,
      socketUrl: origin,
      appUrl: origin,
    };
  }

  const productionOrigin = "https://yourdomain.com";
  const developmentOrigin = "http://localhost:3000";
  const developmentBackend = "http://localhost:5000";
  const fallbackOrigin = process.env.NODE_ENV === "production" ? productionOrigin : developmentOrigin;
  const fallbackBackend = process.env.NODE_ENV === "production" ? productionOrigin : developmentBackend;

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || `${fallbackBackend}/api`,
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || fallbackBackend,
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
