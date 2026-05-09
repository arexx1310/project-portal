import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authorized." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  
    
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};


export default protect;