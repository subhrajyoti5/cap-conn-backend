const { ApiError } = require("../utils/ApiError");
const { logger } = require("../utils/logger");

const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;
  const safe = { ...body };
  const secretKeys = ["password", "token", "secret", "authorization", "key"];
  for (const key of Object.keys(safe)) {
    if (secretKeys.some((s) => key.toLowerCase().includes(s))) {
      safe[key] = "[REDACTED]";
    }
  }
  return safe;
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    logger.warn({
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
    }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err.code === "P2002") {
    logger.warn({ errCode: err.code, path: req.path }, "Unique constraint violation");
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
      code: "CONFLICT",
    });
  }

  if (err.code === "P2025") {
    logger.warn({ errCode: err.code, path: req.path }, "Record not found");
    return res.status(404).json({
      success: false,
      message: "Resource not found",
      code: "NOT_FOUND",
    });
  }

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code: err.code,
      },
      path: req.path,
      method: req.method,
      body: sanitizeBody(req.body),
    },
    "Internal server error"
  );

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
  });
};

module.exports = { errorHandler };
