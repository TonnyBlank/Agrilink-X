import express from "express";
import cors from "cors";
import "express-async-errors";
import "dotenv/config";

import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import messagesRouter from "./routes/messages";
import cropEventsRouter from "./routes/cropEvents";
import profilesRouter from "./routes/profiles";
import idVerificationRouter from "./routes/idVerification";
import microLoansRouter from "./routes/microLoans";
import paymentsRouter from "./routes/payments";
import adminRouter from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const allowedOrigins = new Set(
  [
    process.env.CLIENT_ORIGIN,
    "https://agrilink-x.vercel.app",
    "http://localhost:8080",
  ].filter(Boolean),
);

// ── Middleware ──────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "AgriLink X Backend", time: new Date() });
});

// ── API Routes ──────────────────────────────────────────────────
app.use("/api/products",        productsRouter);
app.use("/api/orders",          ordersRouter);
app.use("/api/messages",        messagesRouter);
app.use("/api/crop-events",     cropEventsRouter);
app.use("/api/profiles",        profilesRouter);
app.use("/api/id-verification", idVerificationRouter);
app.use("/api/micro-loans",     microLoansRouter);
app.use("/api/payments",        paymentsRouter);
app.use("/api/admin",           adminRouter);

// ── 404 handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 AgriLink X Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

export default app;
