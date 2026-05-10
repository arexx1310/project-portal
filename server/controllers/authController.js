import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";
import sendEmail from "../utils/sendEmail.js";

/* ─────────────────────────────────────────────────────────────
   TOKEN HELPERS
───────────────────────────────────────────────────────────── */
const generateToken = (id, role, profile = {}) =>
  jwt.sign({ id, role, ...profile }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "2d",
  });

const getRoleProfile = async (user) => {
  if (user.role === "faculty") {
    const f = await Faculty.findOne({ user: user._id })
      .select("_id user department roles")
      .populate("user", "-_id email")
      .lean();
    return f
      ? { email: f.user.email, facultyId: f._id, department: f.department, roles: f.roles }
      : {};
  }

  if (user.role === "student") {
    const s = await Student.findOne({ user: user._id })
      .select("_id user department session semester groupId programType")
      .populate("user", "email")
      .lean();
    return s
      ? {
          email:      s.user.email,
          studentId:  s._id,
          department: s.department,
          session:    s.session,
          semester:   s.semester,
          groupId:    s.groupId ?? null,
          isPG:       s.programType === "PG",
        }
      : {};
  }

  return {};
};

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge:   2 * 24 * 60 * 60 * 1000,
    path:     "/",
  });
};

export const refreshAuthCookie = async (res, req) => {
  const user    = await User.findById(req.user.id).select("role");
  const profile = await getRoleProfile(user);
  const token   = generateToken(user._id, user.role, profile);
  setAuthCookie(res, token);
};

/* ─────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────── */
export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      return res.status(400).json({ success: false, message: "Email and password required." });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password name email role isActive");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is inactive." });
    }

    const isAdminRoute = req.originalUrl.includes("/admin/login");
    const isAdminUser  = user.role === "admin";

    if (isAdminUser && !isAdminRoute) {
      return res.status(403).json({ success: false, message: "Admin must login from admin portal." });
    }
    if (!isAdminUser && isAdminRoute) {
      return res.status(403).json({ success: false, message: "Unauthorized admin access." });
    }

    const profile = await getRoleProfile(user);
    const token   = generateToken(user._id, user.role, profile);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        ...(user.role === "faculty" && { roles: profile.roles ?? [] }),
        ...(user.role === "student" && { semester: profile.semester, hasGroup: !!profile.groupId }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────
   GET CURRENT USER
───────────────────────────────────────────────────────────── */
export const getMe = (req, res) => {
  const { id, email, role, roles, studentId, facultyId, department, session, semester, groupId, isPG } = req.user;

  return res.status(200).json({
    success: true,
    user: {
      id,
      role,
      email,
      ...(role === "faculty" && { department, roles: roles ?? [] }),
      ...(role === "student" && { semester, hasGroup: !!groupId, isPG }),
    },
  });
};

/* ─────────────────────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────────────────────── */
export const logout = (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", "", {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge:   0,
    path:     "/",
  });
  return res.json({ success: true, message: "Logged out." });
};

/* ─────────────────────────────────────────────────────────────
   UPDATE PASSWORD
───────────────────────────────────────────────────────────── */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword.trim() ||
      !newPassword.trim()
    ) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain an uppercase letter, a number, and a special character." });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    if (await user.matchPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must differ from current password." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────
   SEND OTP
   POST /api/auth/forgot-password
───────────────────────────────────────────────────────────── */
export const sendOtp = async (req, res, next) => {
  try {
    let { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email required." });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    const generic = { success: true, message: "If that email exists, an OTP has been sent." };
    if (!user || !user.isActive) return res.status(200).json(generic);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode    = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to:      user.email,
      subject: "Your Password Reset OTP",
      html:    `
        <p>Hi,</p>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>Valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    console.log("Sending OTP to:", user.email);

    return res.status(200).json(generic);
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────
   VERIFY OTP + RESET PASSWORD
   POST /api/auth/verify-otp
───────────────────────────────────────────────────────────── */
export const verifyOtp = async (req, res, next) => {
  try {
    let { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp?.trim() || !newPassword?.trim()) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({
      email,
      otpCode:    otp,
      otpExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    if (newPassword.length < 8 || !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8+ chars with uppercase, number, and special character.",
      });
    }

    if (await user.matchPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must differ from current." });
    }

    user.password   = newPassword;
    user.otpCode    = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful. Please log in." });
  } catch (error) {
    next(error);
  }
};