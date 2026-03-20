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
import paymentsRouter from "./routes/payments";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:8080", credentials: true }));
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
app.use("/api/payments",        paymentsRouter);

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
