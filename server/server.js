import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import { registerDeadlineCrons } from "./controllers/cron/deadlineController.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

// Admin seed
import createAdmin from "./config/initAdmin.js";

/* ================= APP ================= */
const app = express();

// Trust proxy — MUST be first, before any middleware.
// Without this, Express sees the internal proxy IP, not the real client IP.
// Rate limiters key on req.ip, so without this every user shares one IP → everyone
// gets rate-limited together. Also required for secure cookies to work behind
// Nginx / Render / Railway / Heroku.
app.set("trust proxy", 1);

/* ================= SECURITY HEADERS ================= */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL,
          process.env.BACKEND_URL,
        ].filter(Boolean),
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
  })
);

/* ================= CORS ================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

/* ================= BODY PARSER ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= NoSQL INJECTION SANITIZER ================= */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (/^\$|\./.test(key)) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  }
};
app.use((req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  next();
});

/* ================= COOKIE PARSER ================= */
app.use(cookieParser());

/* ================= GLOBAL RATE LIMITER ================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

/* ================= DB + ADMIN ================= */
connectDB().then(() => {
  createAdmin();
  registerDeadlineCrons();
});

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);

/* ================= ERROR HANDLING ================= */
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

/* ================= PROCESS SAFETY ================= */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  process.exit(1);
});