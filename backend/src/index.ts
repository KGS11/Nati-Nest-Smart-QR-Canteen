import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { prisma } from "./config/db";
import { validateEnv } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import requestLogger from "./middlewares/requestLogger";
import { apiRateLimit, authRateLimit, securityHeaders } from "./middlewares/security";
import authRouter from "./routes/auth.routes";
import cateringRouter from "./routes/catering.routes";
import categoryRouter from "./routes/category.routes";
import customerRouter from "./routes/customer.routes";
import feedbackRouter from "./routes/feedback.routes";
import kitchenRouter from "./routes/kitchen.routes";
import menuRouter from "./routes/menu.routes";
import orderRouter from "./routes/order.routes";
import paymentRouter from "./routes/payment.routes";
import protectedExampleRouter from "./routes/protected.example";
import reportsRouter from "./routes/reports.routes";
import serverRouter from "./routes/server.routes";
import settingsRouter from "./routes/settings.routes";
import staffRouter from "./routes/staff.routes";
import tableRouter from "./routes/table.routes";
import dailyMenuRouter from "./routes/daily-menu.routes";
import adminRouter from "./routes/admin.routes";
import { checkAutoReleaseClaims } from "./services/auto-release.service";
import { registerSocketHandlers } from "./sockets";
import { logger } from "./config/logger";

dotenv.config();
const env = validateEnv();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const server = http.createServer(app);
const port = env.PORT;
const clientUrl = env.CLIENT_URL;
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...((env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)),
];
if (clientUrl && !allowedOrigins.includes(clientUrl)) {
  allowedOrigins.push(clientUrl);
}

const verifyDatabaseConnection = async () => {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      logger.info("Database connection verified successfully.");
      return;
    } catch (error) {
      logger.error("Database connection startup check failed.", {
        attempt,
        maxAttempts,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt === maxAttempts) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: [
          "'self'",
          ...allowedOrigins,
          ...allowedOrigins.map(url => url.replace(/^http/, "ws")),
        ],
        frameAncestors: ["'none'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com", "localhost:5000", "127.0.0.1:5000"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(compression());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  }),
);
app.use(securityHeaders);
app.use(requestLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    dotfiles: "deny",
    setHeaders: (response) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Content-Disposition", "inline");
      response.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

app.get("/health", async (_request, response) => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    return response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      dbLatencyMs,
      message: "Nati Nest API running",
    });
  } catch (_error) {
    return response.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      dbLatencyMs: null,
      message: "Nati Nest API running with database connectivity issues",
    });
  }
});

app.use("/api/auth", authRateLimit);
app.use("/api", apiRateLimit);

app.get("/ready", (_request, response) => {
  response.json({
    status: "ready",
    message: "Nati Nest API running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/catering", cateringRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/menu-items", menuRouter);
app.use("/api/menu", menuRouter);
app.use("/api/tables", tableRouter);
app.use("/api/customer", customerRouter);
app.use("/api/customer/orders", orderRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/server", serverRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/protected", protectedExampleRouter);
app.use("/api/daily-menu", dailyMenuRouter);
app.use("/api/admin", adminRouter);

registerSocketHandlers(io);

// Export io so services can emit events into session rooms
export { io };

app.use(errorHandler);

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info("shutdown:start", { signal });

  const timeout = setTimeout(() => {
    logger.error("shutdown:timeout", { signal });
    process.exit(1);
  }, 30_000);

  io.close(() => {
    server.close(() => {
      void prisma.$disconnect().finally(() => {
        clearTimeout(timeout);
        logger.info("shutdown:complete", { signal });
        process.exit(0);
      });
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (process.env.NODE_ENV !== "test") {
  process.on("uncaughtException", (error) => {
    logger.error("process:uncaught_exception", { error });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("process:unhandled_rejection", { reason });
    process.exit(1);
  });
}

if (process.env.NODE_ENV !== "test") {
  void verifyDatabaseConnection().finally(() => {
    server.listen(Number(port), "0.0.0.0", () => {
      logger.info(`Nati Nest API listening on port ${port}`);
      logger.info(`Local Network Access: http://10.71.211.179:${port}`);
      setInterval(() => {
        void checkAutoReleaseClaims();
      }, 60000);
    });
  });
}

export { app, server };
