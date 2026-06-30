const getEnv = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    return {
      apiUrl: `${origin}/api`,
      socketUrl: origin,
      appUrl: origin,
    };
  }

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
