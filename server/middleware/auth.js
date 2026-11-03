const jwt = require("jsonwebtoken");
const User = require("../models/User");

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

// Requires a valid token
const protect = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ message: "Not authorised. Please log in." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists." });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

// Attaches req.user when a valid token is present, otherwise continues as guest
const optionalAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {
    /* ignore invalid token for guests */
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have access to this resource." });
  }
  next();
};

module.exports = { protect, optionalAuth, authorize };
