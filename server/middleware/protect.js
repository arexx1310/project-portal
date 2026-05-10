import { promisify } from "util";
const verifyAsync = promisify(jwt.verify);

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({...});
    req.user = await verifyAsync(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({...});
  }
};

export default protect;