import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";

/* ================= Helpers ================= */

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "2d",
  });

// const generateSocketToken = (id, role) =>
//   jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "2h" });

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

/* ================= Fetch role profile ================= */

const getRoleData = async (user) => {
  let facultyData = null;
  let studentData = null;

  if (user.role === "faculty") {
    const profile = await Faculty.findOne({ user: user._id })
      .select("departmentConfig roles")
      .lean();
    if (profile) {
      facultyData = { departmentId: profile.departmentConfig, roles: profile.roles };
    }
  }

  if (user.role === "student") {
    const profile = await Student.findOne({ user: user._id })
      .select("departmentConfig rollNumber")
      .lean();
    if (profile) {
      studentData = { departmentId: profile.departmentConfig, rollNumber: profile.rollNumber };
    }
  }

  return { facultyData, studentData };
};

/* ================= Login ================= */

export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.trim() === "" ||
      password.trim() === ""
    ) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is inactive" });
    }

    const isAdminRoute = req.originalUrl.includes("/admin/login");
    const isAdminUser = user.role === "admin";

    if (isAdminUser && !isAdminRoute) {
      return res.status(403).json({ success: false, message: "Admin must login from admin portal" });
    }
    if (!isAdminUser && isAdminRoute) {
      return res.status(403).json({ success: false, message: "Unauthorized admin access" });
    }

    const { facultyData, studentData } = await getRoleData(user);

    const token = generateToken(user._id, user.role);

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      // socketToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: facultyData,
        student: studentData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ================= Get Current User ================= */

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { facultyData, studentData } = await getRoleData(user);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: facultyData,
        student: studentData,
      },
    });
  } catch (error) {
    next(error);
  }
};


/* ================= Logout ================= */

export const logout = (req, res) => {
  // Logout cookie must mirror the exact same attributes as setAuthCookie.
  // If sameSite/secure/path differ, the browser treats it as a different cookie
  // and the original auth cookie is NOT cleared — user appears logged out on the
  // frontend but the cookie persists and can still authenticate API requests.
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 0,
    path: "/",
  });
  res.json({ success: true, message: "Logged out" });
};

/* ================= Update Password ================= */

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      currentPassword.trim() === "" ||
      newPassword.trim() === ""
    ) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!strong.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain uppercase, number, and special character" });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    if (await user.matchPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};