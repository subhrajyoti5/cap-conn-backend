const { asyncHandler } = require("../../utils/asyncHandler");
const assessmentsService = require("./assessments.service");

const getUploadUrl = asyncHandler(async (req, res) => {
  const data = await assessmentsService.getUploadUrl(req.body, req.user);
  res.json({ success: true, data });
});

const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.createAssessment(req.body, req.user);
  res.status(201).json({ success: true, data: assessment });
});

const generateAiQuestions = asyncHandler(async (req, res) => {
  const data = await assessmentsService.generateAiQuestions(
    req.params.id,
    req.body,
    req.user
  );
  res.json({ success: true, data });
});

const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.getAssessment(req.params.id, req.user);
  res.json({ success: true, data: assessment });
});

const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.updateAssessment(
    req.params.id,
    req.body,
    req.user
  );
  res.json({ success: true, data: assessment });
});

const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.publishAssessment(
    req.params.id,
    req.user
  );
  res.json({ success: true, data: assessment });
});

const listCourseAssessments = asyncHandler(async (req, res) => {
  const data = await assessmentsService.listCourseAssessments(
    req.params.id,
    req.user
  );
  res.json({ success: true, data });
});

const startAssessment = asyncHandler(async (req, res) => {
  const submission = await assessmentsService.startAssessment(
    req.params.id,
    req.user.id
  );
  res.status(201).json({ success: true, data: submission });
});

const submitAssessment = asyncHandler(async (req, res) => {
  const submission = await assessmentsService.submitAssessment(
    req.params.id,
    req.user.id,
    req.body.answers
  );
  res.json({ success: true, data: submission });
});

const submitDocumentAssessment = asyncHandler(async (req, res) => {
  const submission = await assessmentsService.submitDocumentAssessment(
    req.params.id,
    req.user.id,
    req.body
  );
  res.json({ success: true, data: submission });
});

const gradeManualSubmission = asyncHandler(async (req, res) => {
  const submission = await assessmentsService.gradeManualSubmission(
    req.params.id,
    req.params.submissionId,
    req.body,
    req.user
  );
  res.json({ success: true, data: submission });
});

const getResult = asyncHandler(async (req, res) => {
  const result = await assessmentsService.getResult(req.params.id, req.user);
  res.json({ success: true, data: result });
});

const listSubmissions = asyncHandler(async (req, res) => {
  const result = await assessmentsService.listSubmissions(
    req.params.id,
    req.user,
    req.validated?.query || req.query
  );
  res.json({ success: true, ...result });
});

module.exports = {
  getUploadUrl,
  createAssessment,
  generateAiQuestions,
  getAssessment,
  updateAssessment,
  publishAssessment,
  listCourseAssessments,
  startAssessment,
  submitAssessment,
  submitDocumentAssessment,
  gradeManualSubmission,
  getResult,
  listSubmissions,
};
