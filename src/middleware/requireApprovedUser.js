const { ApiError } = require("../utils/ApiError");

const requireApprovedUser = (req, res, next) => {
  const { status } = req.user;

  if (status === "PENDING") {
    throw new ApiError(403, "Account pending approval", "ACCOUNT_PENDING");
  }
  if (status === "REJECTED") {
    throw new ApiError(403, "Account rejected", "ACCOUNT_REJECTED");
  }
  if (status === "SUSPENDED") {
    throw new ApiError(403, "Account suspended", "ACCOUNT_SUSPENDED");
  }

  next();
};

module.exports = { requireApprovedUser };
