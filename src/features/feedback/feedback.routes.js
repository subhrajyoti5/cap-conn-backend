const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { validate } = require("../../middleware/validate");
const feedbackController = require("./feedback.controller");
const {
  courseFeedbackSchema,
  trainerFeedbackSchema,
  resourceFeedbackSchema,
  assessmentCommentSchema,
} = require("./feedback.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

// Course level feedback & ratings
router.post("/feedback", validate(courseFeedbackSchema), feedbackController.createCourseFeedback);
router.post("/courses/:id/feedback", validate(courseFeedbackSchema), feedbackController.createCourseFeedback);
router.delete("/courses/:id/feedback", feedbackController.deleteCourseFeedback);
router.get("/courses/:id/feedback", feedbackController.getCourseFeedback);

// Individual Trainer feedback per course
router.post(
  "/courses/:id/trainers/:trainerId/feedback",
  validate(trainerFeedbackSchema),
  feedbackController.createTrainerFeedback
);
router.delete(
  "/courses/:id/trainers/:trainerId/feedback",
  feedbackController.deleteTrainerFeedback
);
router.get(
  "/courses/:id/trainers/:trainerId/feedback",
  feedbackController.getTrainerCourseFeedback
);

// Resource level ratings & feedback
router.post(
  "/resources/:id/feedback",
  validate(resourceFeedbackSchema),
  feedbackController.createResourceFeedback
);
router.put(
  "/resources/comments/:commentId",
  validate(resourceFeedbackSchema),
  feedbackController.updateResourceFeedback
);
router.delete(
  "/resources/comments/:commentId",
  feedbackController.deleteResourceFeedback
);
router.get("/resources/:id/feedback", feedbackController.getResourceFeedback);

// Assessment comments & grievances
router.post(
  "/assessments/:id/comments",
  validate(assessmentCommentSchema),
  feedbackController.createAssessmentComment
);
router.put(
  "/assessments/comments/:commentId",
  validate(assessmentCommentSchema),
  feedbackController.updateAssessmentComment
);
router.delete(
  "/assessments/comments/:commentId",
  feedbackController.deleteAssessmentComment
);
router.get("/assessments/:id/comments", feedbackController.getAssessmentComments);

module.exports = router;
