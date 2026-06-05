import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { prisma } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import authRouter from "./routes/auth.routes";
import categoryRouter from "./routes/category.routes";
import customerRouter from "./routes/customer.routes";
import feedbackRouter from "./routes/feedback.routes";
import kitchenRouter from "./routes/kitchen.routes";
import menuRouter from "./routes/menu.routes";
import paymentRouter from "./routes/payment.routes";
import protectedExampleRouter from "./routes/protected.example";
import reportsRouter from "./routes/reports.routes";
import serverRouter from "./routes/server.routes";
import settingsRouter from "./routes/settings.routes";
import tableRouter from "./routes/table.routes";
import { registerSocketHandlers } from "./sockets";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT ?? 5000;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    message: "Nati Nest API running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/menu-items", menuRouter);
app.use("/api/tables", tableRouter);
app.use("/api/customer", customerRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/server", serverRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/protected", protectedExampleRouter);

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

server.listen(port, () => {
  console.log(`Nati Nest API listening on port ${port}`);
});
