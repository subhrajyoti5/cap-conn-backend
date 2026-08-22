const achievementsRepo = require("./achievements.repository");

const listAchievements = async (query) => {
  return achievementsRepo.findAll(query);
};

const createAchievement = async (data, authorId) => {
  return achievementsRepo.create({ ...data, authorId });
};

module.exports = { listAchievements, createAchievement };
