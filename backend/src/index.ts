import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { prisma } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
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

const app = express();
const server = http.createServer(app);
const port = process.env.PORT ?? 5000;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
if (clientUrl && !allowedOrigins.includes(clientUrl)) {
  allowedOrigins.push(clientUrl);
}

if (process.env.NODE_ENV !== "test" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  logger.error("FATAL: JWT_SECRET must be 32+ characters");
  process.exit(1);
}

const validateDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL is not configured");
    return false;
  }

  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    if (!["postgresql:", "postgres:"].includes(databaseUrl.protocol)) {
      logger.error("DATABASE_URL must use the PostgreSQL protocol", {
        protocol: databaseUrl.protocol,
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("DATABASE_URL is invalid", { error });
    return false;
  }
};

const verifyDatabaseConnection = async () => {
  if (!validateDatabaseUrl()) {
    return;
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection verified successfully.");
  } catch (error) {
    logger.error("Database connection startup check failed. API will run in degraded mode.", {
      error: error instanceof Error ? error.message : String(error),
    });
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
        connectSrc: [
          "'self'",
          ...allowedOrigins,
          ...allowedOrigins.map(url => url.replace(/^http/, "ws")),
        ],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(securityHeaders);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
      message: "Nati Nest API running",
    });
  } catch (_error) {
    return response.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      uptime: process.uptime(),
      message: "Nati Nest API running with database connectivity issues",
    });
  }
});

app.use("/api/auth/login", authRateLimit);
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

const shutdown = async () => {
  try {
    await prisma.$disconnect();
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

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
