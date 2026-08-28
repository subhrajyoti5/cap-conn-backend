const { asyncHandler } = require("../../utils/asyncHandler");
const coursesService = require("./courses.service");

const listCourses = asyncHandler(async (req, res) => {
  const result = await coursesService.listCourses(req.validated.query, req.user);
  res.json({ success: true, ...result });
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await coursesService.getCourse(req.params.id, req.user);
  res.json({ success: true, data: course });
});

const createCourse = asyncHandler(async (req, res) => {
  const course = await coursesService.createCourse(req.body, req.user.id);
  res.status(201).json({ success: true, data: course });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await coursesService.updateCourse(req.params.id, req.body);
  res.json({ success: true, data: course });
});

const deleteCourse = asyncHandler(async (req, res) => {
  await coursesService.deleteCourse(req.params.id, req.user);
  res.json({ success: true, data: { deleted: true } });
});

const publishCourse = asyncHandler(async (req, res) => {
  const course = await coursesService.publishCourse(req.params.id, req.user.id);
  res.json({ success: true, data: course });
});

const inviteTrainer = asyncHandler(async (req, res) => {
  const invitation = await coursesService.inviteTrainer(
    req.params.id,
    req.body.email,
    req.user.id
  );
  res.status(201).json({ success: true, data: invitation });
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await coursesService.acceptInvitation(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

const rejectInvitation = asyncHandler(async (req, res) => {
  const result = await coursesService.rejectInvitation(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

const listPendingInvitations = asyncHandler(async (req, res) => {
  const invitations = await coursesService.listPendingInvitations(req.user.id);
  res.json({ success: true, data: invitations });
});

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  inviteTrainer,
  acceptInvitation,
  rejectInvitation,
  listPendingInvitations,
};
