const { asyncHandler } = require("../../utils/asyncHandler");
const profilesService = require("./profiles.service");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profilesService.getMyProfile(req.user);
  res.json({ success: true, data: profile });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await profilesService.updateMyProfile(req.user, req.body);
  res.json({ success: true, data: profile });
});

const listQualifications = asyncHandler(async (req, res) => {
  const data = await profilesService.listChildren(req.user, "qualification");
  res.json({ success: true, data });
});

const addQualification = asyncHandler(async (req, res) => {
  const item = await profilesService.addChild(req.user, "qualification", req.body);
  res.status(201).json({ success: true, data: item });
});

const removeQualification = asyncHandler(async (req, res) => {
  await profilesService.removeChild(req.user, "qualification", req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

const listWorkExperience = asyncHandler(async (req, res) => {
  const data = await profilesService.listChildren(req.user, "workExperience");
  res.json({ success: true, data });
});

const addWorkExperience = asyncHandler(async (req, res) => {
  const item = await profilesService.addChild(req.user, "workExperience", req.body);
  res.status(201).json({ success: true, data: item });
});

const removeWorkExperience = asyncHandler(async (req, res) => {
  await profilesService.removeChild(req.user, "workExperience", req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

const listSkills = asyncHandler(async (req, res) => {
  const data = await profilesService.listChildren(req.user, "skill");
  res.json({ success: true, data });
});

const addSkill = asyncHandler(async (req, res) => {
  const item = await profilesService.addChild(req.user, "skill", req.body);
  res.status(201).json({ success: true, data: item });
});

const removeSkill = asyncHandler(async (req, res) => {
  await profilesService.removeChild(req.user, "skill", req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

const listInterests = asyncHandler(async (req, res) => {
  const data = await profilesService.listChildren(req.user, "interest");
  res.json({ success: true, data });
});

const addInterest = asyncHandler(async (req, res) => {
  const item = await profilesService.addInterest(req.user, req.body);
  res.status(201).json({ success: true, data: item });
});

const removeInterest = asyncHandler(async (req, res) => {
  await profilesService.removeChild(req.user, "interest", req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

const listMyCompetencies = asyncHandler(async (req, res) => {
  const profile = await profilesService.getMyProfile(req.user);
  res.json({ success: true, data: profile.trainerCompetencies || [] });
});

const addMyCompetency = asyncHandler(async (req, res) => {
  const item = await profilesService.addTrainerCompetency(req.user, req.body);
  res.status(201).json({ success: true, data: item });
});

const removeMyCompetency = asyncHandler(async (req, res) => {
  await profilesService.removeTrainerCompetency(req.user, req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  listQualifications,
  addQualification,
  removeQualification,
  listWorkExperience,
  addWorkExperience,
  removeWorkExperience,
  listSkills,
  addSkill,
  removeSkill,
  listInterests,
  addInterest,
  removeInterest,
  listMyCompetencies,
  addMyCompetency,
  removeMyCompetency,
};
