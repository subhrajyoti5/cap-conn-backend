const { verifyToken } = require("@clerk/backend");
const { clerkSecretKey } = require("../config/env");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  try {
    const { sub } = await verifyToken(token, {
      secretKey: clerkSecretKey,
      clockSkewInMs: 300000, // 5 minutes clock skew tolerance for local dev
    });
    req.auth = { userId: sub };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    throw new ApiError(401, "Invalid or expired token", "UNAUTHENTICATED");
  }
});

module.exports = { authenticate };
