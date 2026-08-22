const { asyncHandler } = require("../../utils/asyncHandler");
const achievementsService = require("./achievements.service");

const listAchievements = asyncHandler(async (req, res) => {
  const result = await achievementsService.listAchievements(req.validated.query);
  res.json({ success: true, ...result });
});

const createAchievement = asyncHandler(async (req, res) => {
  const achievement = await achievementsService.createAchievement(
    req.body,
    req.user.id
  );
  res.status(201).json({ success: true, data: achievement });
});

module.exports = { listAchievements, createAchievement };
