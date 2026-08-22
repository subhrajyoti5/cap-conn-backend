const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { strictLimiter } = require("../../middleware/rateLimiter");
const authController = require("./auth.controller");

const router = express.Router();

// Public routes
router.post("/register", strictLimiter, authController.register);
router.post("/login", strictLimiter, authController.login);

// Protected routes
router.get("/me", authenticate, requireUser, authController.getMe);

module.exports = router;
