const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const enrollmentsController = require("./enrollments.controller");
const { listEnrollmentsSchema, paramsSchema } = require("./enrollments.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/courses/:id/enroll",
  requireRole("TRAINEE"),
  validate(paramsSchema),
  enrollmentsController.enroll
);

router.delete(
  "/courses/:id/enroll",
  requireRole("TRAINEE"),
  validate(paramsSchema),
  enrollmentsController.drop
);

router.get(
  "/me/enrollments",
  requireRole("TRAINEE"),
  validate(listEnrollmentsSchema),
  enrollmentsController.listMyEnrollments
);

router.get(
  "/courses/:id/enrollments",
  requireRole("TRAINER", "ADMIN"),
  validate(paramsSchema),
  enrollmentsController.listCourseEnrollments
);

module.exports = router;
