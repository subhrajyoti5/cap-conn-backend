const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const feedbackController = require("./feedback.controller");
const { feedbackSchema, listSchema } = require("./feedback.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/feedback",
  requireRole("TRAINEE"),
  validate(feedbackSchema),
  feedbackController.createFeedback
);

router.get(
  "/courses/:id/feedback",
  requireRole("TRAINER", "ADMIN"),
  validate(listSchema),
  feedbackController.listCourseFeedback
);

module.exports = router;
