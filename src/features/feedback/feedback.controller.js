const { asyncHandler } = require("../../utils/asyncHandler");
const feedbackService = require("./feedback.service");

const createCourseFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createCourseFeedback(
    { courseId: req.params.id || req.body.courseId, ...req.body },
    req.user
  );
  res.status(201).json({ success: true, data: feedback });
});

const getCourseFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.getCourseFeedback(req.params.id);
  res.json({ success: true, data: result });
});

const createTrainerFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createTrainerFeedback(
    { courseId: req.params.id, trainerId: req.params.trainerId, ...req.body },
    req.user
  );
  res.status(201).json({ success: true, data: feedback });
});

const getTrainerCourseFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.getTrainerCourseFeedback(
    req.params.id,
    req.params.trainerId
  );
  res.json({ success: true, data: result });
});

const createResourceFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createResourceFeedback(
    req.params.id,
    req.body,
    req.user
  );
  res.status(201).json({ success: true, data: feedback });
});

const getResourceFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.getResourceFeedback(req.params.id);
  res.json({ success: true, data: result });
});

const createAssessmentComment = asyncHandler(async (req, res) => {
  const comment = await feedbackService.createAssessmentComment(
    req.params.id,
    req.body,
    req.user
  );
  res.status(201).json({ success: true, data: comment });
});

const getAssessmentComments = asyncHandler(async (req, res) => {
  const comments = await feedbackService.getAssessmentComments(req.params.id);
  res.json({ success: true, data: comments });
});

module.exports = {
  createCourseFeedback,
  getCourseFeedback,
  createTrainerFeedback,
  getTrainerCourseFeedback,
  createResourceFeedback,
  getResourceFeedback,
  createAssessmentComment,
  getAssessmentComments,
};
