const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const enrollmentsController = require("./enrollments.controller");
const { listEnrollmentsSchema, paramsSchema, approveParamsSchema } = require("./enrollments.validation");

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

router.post(
  "/courses/:id/drop",
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
  "/courses/enrollments/pending",
  requireRole("TRAINER", "ADMIN"),
  enrollmentsController.listPendingEnrollments
);

router.get(
  "/courses/:id/enrollments",
  requireRole("TRAINER", "ADMIN"),
  validate(paramsSchema),
  enrollmentsController.listCourseEnrollments
);

router.post(
  "/courses/:id/enrollments/:traineeId/approve",
  requireRole("TRAINER", "ADMIN"),
  validate(approveParamsSchema),
  enrollmentsController.approveEnrollment
);

router.post(
  "/courses/:id/enrollments/:traineeId/reject",
  requireRole("TRAINER", "ADMIN"),
  validate(approveParamsSchema),
  enrollmentsController.rejectEnrollment
);

router.post(
  "/courses/:id/remove-trainee",
  requireRole("TRAINER", "ADMIN"),
  validate(paramsSchema),
  enrollmentsController.removeTrainee
);

module.exports = router;
