const { asyncHandler } = require("../../utils/asyncHandler");
const subjectsService = require("./subjects.service");

const listSubjects = asyncHandler(async (req, res) => {
  const data = await subjectsService.listSubjects();
  res.json({ success: true, data });
});

const createSubject = asyncHandler(async (req, res) => {
  const item = await subjectsService.createSubject(req.body);
  res.status(201).json({ success: true, data: item });
});

module.exports = { listSubjects, createSubject };
