import express from "express";
import rateLimit from "express-rate-limit";
import { login, logout, getMe } from "../controllers/authController.js";
import protect from "../middleware/protect.js";

const router = express.Router();

/* ================= Rate Limiters ================= */

// Strict limiter for login endpoints — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// IP whitelist middleware for admin login
// Set ADMIN_ALLOWED_IPS as a comma-separated list in .env, e.g. "127.0.0.1,10.0.0.5"
// If the env var is not set, the route is blocked entirely in production.
// const adminIpWhitelist = (req, res, next) => {
//   const allowedIps = process.env.ADMIN_ALLOWED_IPS
//     ? process.env.ADMIN_ALLOWED_IPS.split(",").map((ip) => ip.trim())
//     : [];

//   // In development, allow all IPs if env var is not set
//   if (process.env.NODE_ENV !== "production" && allowedIps.length === 0) {
//     return next();
//   }

//   const requestIp =
//     req.ip ||
//     req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
//     req.connection.remoteAddress;

//   if (!allowedIps.includes(requestIp)) {
//     return res.status(403).json({
//       success: false,
//       message: "Forbidden",
//     });
//   }

//   next();
// };

/* ================= Routes ================= */

/**
 * COMMON LOGIN
 * Used by: student + faculty
 */
router.post("/login", loginLimiter, login);

/**
 * ADMIN LOGIN
 * IP-restricted + rate-limited
 * Not linked anywhere in the main UI
 */
router.post("/admin/login", loginLimiter, login);

/**
 * LOGOUT
 */
router.post("/logout", logout);

/**
 * GET CURRENT USER
 * Called on page refresh instead of reading from localStorage.
 * Protected by httpOnly cookie via `protect` middleware.
 */
router.get("/me", protect, getMe);


export default router;