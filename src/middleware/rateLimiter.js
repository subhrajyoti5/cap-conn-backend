const rateLimit = require("express-rate-limit");
const { rateLimitWindowMs, rateLimitMax } = require("../config/env");

const defaultLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests",
      code: "RATE_LIMITED",
    });
  },
});

const strictLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests",
      code: "RATE_LIMITED",
    });
  },
});

module.exports = { defaultLimiter, strictLimiter };
