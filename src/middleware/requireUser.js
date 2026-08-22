const { prisma } = require("../database/prisma");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

// Middleware that ensures a valid authenticated user exists in DB
const requireUser = asyncHandler(async (req, res, next) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  req.user = user;
  next();
});

module.exports = { requireUser };
