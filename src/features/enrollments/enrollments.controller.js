const { asyncHandler } = require("../../utils/asyncHandler");
const enrollmentsService = require("./enrollments.service");

const enroll = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentsService.enrollInCourse(
    req.params.id,
    req.user.id
  );
  res.status(201).json({ success: true, data: enrollment });
});

const drop = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentsService.dropCourse(
    req.params.id,
    req.user.id
  );
  res.json({ success: true, data: enrollment });
});

const listMyEnrollments = asyncHandler(async (req, res) => {
  const result = await enrollmentsService.listMyEnrollments(
    req.user.id,
    req.validated.query
  );
  res.json({ success: true, ...result });
});

const listCourseEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollmentsService.listCourseEnrollments(
    req.params.id,
    req.user
  );
  res.json({ success: true, data });
});

const approveEnrollment = asyncHandler(async (req, res) => {
  const data = await enrollmentsService.approveEnrollment(
    req.params.id,
    req.params.traineeId,
    req.user.id
  );
  res.json({ success: true, data });
});

const rejectEnrollment = asyncHandler(async (req, res) => {
  const data = await enrollmentsService.rejectEnrollment(
    req.params.id,
    req.params.traineeId,
    req.user.id,
    req.body.message
  );
  res.json({ success: true, data });
});

const removeTrainee = asyncHandler(async (req, res) => {
  const data = await enrollmentsService.removeTrainee(
    req.params.id,
    req.body.traineeId,
    req.user.id,
    req.body.reason
  );
  res.json({ success: true, data });
});

const listPendingEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollmentsService.listPendingEnrollmentsForTrainer(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  enroll,
  drop,
  listMyEnrollments,
  listCourseEnrollments,
  approveEnrollment,
  rejectEnrollment,
  removeTrainee,
  listPendingEnrollments,
};
