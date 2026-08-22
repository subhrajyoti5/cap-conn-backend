const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.auth = { userId: decoded.userId };
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    throw new ApiError(401, "Invalid or expired token", "UNAUTHENTICATED");
  }
});

module.exports = { authenticate };
