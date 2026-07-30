import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const productionAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nati-nest-smart-qr-canteen.vercel.app";
const productionBackendUrl = "https://nati-nest-smart-qr-canteen-production.up.railway.app";
const productionApiUrl = process.env.NEXT_PUBLIC_API_URL ?? `${productionBackendUrl}/api`;
const productionSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? productionApiUrl.replace(/\/api\/?$/, "");
const developmentBackendUrl = "http://localhost:5000";
const backendBase = (isProduction ? productionApiUrl : (process.env.NEXT_PUBLIC_API_URL ?? `${developmentBackendUrl}/api`)).replace(
  /\/api\/?$/,
  "",
);
const devImageSources = isProduction ? [] : ["localhost:5000", "127.0.0.1:5000"];
const devConnectSources = isProduction
  ? []
  : [
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "ws://localhost:5000",
      "ws://127.0.0.1:5000",
    ];
const productionConnectSources = isProduction
  ? [productionAppUrl, productionApiUrl, productionSocketUrl, productionSocketUrl.replace(/^http/, "ws")]
  : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      ...(!isProduction
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
              port: "5000",
            },
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
              port: "5000",
            },
          ]
        : []),
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy all API requests through Next.js so the phone doesn't need
        // direct access to port 5000 (bypasses Windows Firewall).
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendBase}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: res.cloudinary.com images.unsplash.com lh3.googleusercontent.com ${devImageSources.join(" ")}`.trim(),
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${[...productionConnectSources, ...devConnectSources].join(" ")}`.trim(),
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
