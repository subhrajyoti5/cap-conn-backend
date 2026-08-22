const { ApiError } = require("../utils/ApiError");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Insufficient role", "INSUFFICIENT_ROLE");
    }
    next();
  };
};

module.exports = { requireRole };
