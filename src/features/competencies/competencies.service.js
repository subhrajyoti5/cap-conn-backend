const { ApiError } = require("../../utils/ApiError");
const subjectsRepo = require("../subjects/subjects.repository");
const competenciesRepo = require("./competencies.repository");

const listCompetencies = async (subjectId) => {
  return competenciesRepo.findAll(subjectId);
};

const createCompetency = async (data) => {
  const subject = await subjectsRepo.findById(data.subjectId);
  if (!subject) throw new ApiError(404, "Subject not found", "NOT_FOUND");
  try {
    return await competenciesRepo.create(data);
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "Competency name already exists", "CONFLICT");
    }
    throw err;
  }
};

const matchTrainers = async (subjectId) => {
  const subject = await subjectsRepo.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found", "NOT_FOUND");

  const requiredCompetencies = await competenciesRepo.findBySubject(subjectId);
  const requiredNames = new Set(requiredCompetencies.map((c) => c.name));

  const trainers = await competenciesRepo.findTrainers();

  const results = trainers
    .map((trainer) => {
      const profile = trainer.trainerProfile;
      if (!profile) return null;

      const trainerCompetencyNames = new Set(
        profile.trainerCompetencies.map((tc) => tc.competency.name)
      );

      const matched = [];
      const missing = [];
      for (const name of requiredNames) {
        if (trainerCompetencyNames.has(name)) matched.push(name);
        else missing.push(name);
      }

      const matchScore =
        requiredNames.size === 0
          ? 0
          : matched.length / requiredNames.size;

      return {
        trainerId: trainer.id,
        fullName: profile.fullName,
        matchScore,
        matched,
        missing,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore);

  return results;
};

module.exports = {
  listCompetencies,
  createCompetency,
  matchTrainers,
};
