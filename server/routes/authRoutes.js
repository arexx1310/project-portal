import express from "express";
import rateLimit from "express-rate-limit";
import { login, logout, getMe, sendOtp, verifyOtp } from "../controllers/authController.js";
import protect from "../middleware/protect.js";

const router = express.Router();

/* ================= Rate Limiters ================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests. Try again later." },
});

/* ================= Routes ================= */
router.post("/login",              loginLimiter, login);
router.post("/admin/login",        loginLimiter, login);
router.post("/logout",             logout);
router.get("/me",                  protect, getMe);
router.post("/forgot-password",    otpLimiter, sendOtp);
router.post("/verify-otp",         otpLimiter, verifyOtp);

export default router;