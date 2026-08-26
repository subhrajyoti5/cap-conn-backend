const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const { strictLimiter } = require("../../middleware/rateLimiter");
const assessmentsController = require("./assessments.controller");
const {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitSchema,
  submitDocumentSchema,
  gradeSubmissionSchema,
  uploadUrlSchema,
  paramsSchema,
  listSchema,
  generateAiSchema,
} = require("./assessments.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/assessments/upload-url",
  strictLimiter,
  validate(uploadUrlSchema),
  assessmentsController.getUploadUrl
);

router.post(
  "/assessments",
  requireRole("TRAINER", "ADMIN"),
  validate(createAssessmentSchema),
  assessmentsController.createAssessment
);

router.post(
  "/courses/:id/assessments/generate-ai",
  requireRole("TRAINER", "ADMIN"),
  validate(generateAiSchema),
  assessmentsController.generateAiQuestions
);

router.get("/assessments/:id", validate(paramsSchema), assessmentsController.getAssessment);

router.patch(
  "/assessments/:id",
  requireRole("TRAINER", "ADMIN"),
  validate(updateAssessmentSchema),
  assessmentsController.updateAssessment
);

router.patch(
  "/assessments/:id/publish",
  requireRole("TRAINER", "ADMIN"),
  validate(paramsSchema),
  assessmentsController.publishAssessment
);

router.get(
  "/courses/:id/assessments",
  validate(paramsSchema),
  assessmentsController.listCourseAssessments
);

router.post(
  "/assessments/:id/start",
  requireRole("TRAINEE"),
  validate(paramsSchema),
  assessmentsController.startAssessment
);

router.post(
  "/assessments/:id/submit",
  requireRole("TRAINEE"),
  validate(submitSchema),
  assessmentsController.submitAssessment
);

router.post(
  "/assessments/:id/submit-document",
  requireRole("TRAINEE"),
  validate(submitDocumentSchema),
  assessmentsController.submitDocumentAssessment
);

router.post(
  "/assessments/:id/submissions/:submissionId/grade",
  requireRole("TRAINER", "ADMIN"),
  validate(gradeSubmissionSchema),
  assessmentsController.gradeManualSubmission
);

router.get(
  "/assessments/:id/result",
  validate(paramsSchema),
  assessmentsController.getResult
);

router.get(
  "/assessments/:id/submissions",
  requireRole("TRAINER", "ADMIN"),
  validate(listSchema),
  assessmentsController.listSubmissions
);

module.exports = router;
