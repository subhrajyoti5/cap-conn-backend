const { asyncHandler } = require("../../utils/asyncHandler");
const feedbackService = require("./feedback.service");

const createCourseFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createCourseFeedback(
    { courseId: req.params.id || req.body.courseId, ...req.body },
    req.user
  );
  res.status(201).json({ success: true, data: feedback });
});

const deleteCourseFeedback = asyncHandler(async (req, res) => {
  await feedbackService.deleteCourseFeedback(req.params.id, req.user);
  res.json({ success: true, message: "Course feedback deleted" });
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

const deleteTrainerFeedback = asyncHandler(async (req, res) => {
  await feedbackService.deleteTrainerFeedback(
    req.params.id,
    req.params.trainerId,
    req.user
  );
  res.json({ success: true, message: "Trainer feedback deleted" });
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

const updateResourceFeedback = asyncHandler(async (req, res) => {
  await feedbackService.updateResourceFeedback(req.params.commentId, req.body, req.user);
  res.json({ success: true, message: "Resource comment updated" });
});

const deleteResourceFeedback = asyncHandler(async (req, res) => {
  await feedbackService.deleteResourceFeedback(req.params.commentId, req.user);
  res.json({ success: true, message: "Resource comment deleted" });
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

const updateAssessmentComment = asyncHandler(async (req, res) => {
  await feedbackService.updateAssessmentComment(req.params.commentId, req.body, req.user);
  res.json({ success: true, message: "Assessment comment updated" });
});

const deleteAssessmentComment = asyncHandler(async (req, res) => {
  await feedbackService.deleteAssessmentComment(req.params.commentId, req.user);
  res.json({ success: true, message: "Assessment comment deleted" });
});

const getAssessmentComments = asyncHandler(async (req, res) => {
  const comments = await feedbackService.getAssessmentComments(req.params.id);
  res.json({ success: true, data: comments });
});

module.exports = {
  createCourseFeedback,
  deleteCourseFeedback,
  getCourseFeedback,
  createTrainerFeedback,
  deleteTrainerFeedback,
  getTrainerCourseFeedback,
  createResourceFeedback,
  updateResourceFeedback,
  deleteResourceFeedback,
  getResourceFeedback,
  createAssessmentComment,
  updateAssessmentComment,
  deleteAssessmentComment,
  getAssessmentComments,
};
