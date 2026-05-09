import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";

/* ─────────────────────────────────────────────────────────────
   TOKEN HELPERS
───────────────────────────────────────────────────────────── */

/**
 * Encodes user identity + role profile into the JWT.
 * profile fields are spread directly into the payload so middleware
 * can read them without a DB hit.
 */
const generateToken = (id, role, profile = {}) =>
  jwt.sign({ id, role, ...profile }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "2d",
  });

/**
 * Fetches the role-specific profile fields to embed in the token.
 *
 * Student: studentId, department, session, semester, groupId
 * Faculty: facultyId, department, roles
 * Admin:   nothing extra
 */
const getRoleProfile = async (user) => {
  if (user.role === "faculty") {
    const f = await Faculty.findOne({ user: user._id })
      .select("_id user department roles")
      .populate("user","-_id email")
      .lean();
    return f
      ? { email: f.user.email, facultyId: f._id, department: f.department, roles: f.roles }
      : {};
  }

  if (user.role === "student") {
    const s = await Student.findOne({ user: user._id })
      .select("_id user department session semester groupId programType")
      .populate("user","email")
      .lean();
    return s
      ? {
          email: s.user.email,
          studentId:  s._id,
          department: s.department,
          session:    s.session,
          semester:   s.semester,
          groupId:    s.groupId ?? null,
          isPG :      s.programType === "PG" 
        }
      : {};
  }

  return {};
};



const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    // Explicitly set path. Without this, some browsers scope the cookie
    // to the path of the login request (/api/auth/login), so subsequent requests
    // to /api/faculty/* or /api/student/* never receive the cookie.
    path: "/",
  });
};

export const refreshAuthCookie = async (res, req) => {
  const user = await User.findById(req.user.id).select("role");
  const profile = await getRoleProfile(user);
  const token = generateToken(user._id, user.role, profile);
  setAuthCookie(res, token);
};

/* ─────────────────────────────────────────────────────────────
   LOGIN
   POST /api/auth/login        → student + faculty
   POST /api/auth/admin/login  → admin only
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

    // Fetch role profile and embed it into the token.
    // Subsequent requests read these fields from the cookie — no DB hit.
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
        // Surface faculty roles to the frontend for UI gating
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
   GET /api/auth/me
   Reads everything from the verified token — zero DB hit.
───────────────────────────────────────────────────────────── */
export const getMe = (req, res) => {
  // protect middleware has already verified the token and attached req.user.
  // name + email are NOT in the token (no reason to bloat every request with them).
  // This endpoint is called on page refresh — one DB fetch here is acceptable
  // and keeps the token lean.
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
   POST /api/auth/logout
   Cookie attributes must mirror setAuthCookie exactly —
   any mismatch means the browser treats it as a different
   cookie and the original is never cleared.
───────────────────────────────────────────────────────────── */
export const logout = (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 0,
    path: "/",
  });
  return res.json({ success: true, message: "Logged out." });
};

/* ─────────────────────────────────────────────────────────────
   UPDATE PASSWORD
   PUT /api/{role}/updatePassword
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
    await user.save(); // pre-save hook hashes the password

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};