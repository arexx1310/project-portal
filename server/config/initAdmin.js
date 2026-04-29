// config/initAdmin.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const initAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;

  const adminExists = await User.findOne({ email: adminEmail });
  if (adminExists) return;


  await User.create({
    name: "System Admin",
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
    isActive: true,
  });

  console.log("✅ Admin created");
};

export default initAdmin;
