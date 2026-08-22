const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { strictLimiter } = require("../../middleware/rateLimiter");
const authController = require("./auth.controller");

const router = express.Router();

router.post(
  "/webhooks/clerk",
  strictLimiter,
  authController.handleClerkWebhook
);

router.get("/me", authenticate, requireUser, authController.getMe);

module.exports = router;
