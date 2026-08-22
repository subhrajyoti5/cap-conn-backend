const { asyncHandler } = require("../../utils/asyncHandler");
const feedbackService = require("./feedback.service");

const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.body, req.user);
  res.status(201).json({ success: true, data: feedback });
});

const listCourseFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.listCourseFeedback(
    req.params.id,
    req.user,
    req.validated.query
  );
  res.json({ success: true, ...result });
});

module.exports = {
  createFeedback,
  listCourseFeedback,
};
