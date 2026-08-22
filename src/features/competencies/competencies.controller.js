const { asyncHandler } = require("../../utils/asyncHandler");
const competenciesService = require("./competencies.service");

const listCompetencies = asyncHandler(async (req, res) => {
  const data = await competenciesService.listCompetencies(req.validated.query.subjectId);
  res.json({ success: true, data });
});

const createCompetency = asyncHandler(async (req, res) => {
  const competency = await competenciesService.createCompetency(req.body);
  res.status(201).json({ success: true, data: competency });
});

const matchTrainers = asyncHandler(async (req, res) => {
  const data = await competenciesService.matchTrainers(req.validated.query.subjectId);
  res.json({ success: true, data });
});

module.exports = {
  listCompetencies,
  createCompetency,
  matchTrainers,
};
