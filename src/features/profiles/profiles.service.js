const { ApiError } = require("../../utils/ApiError");
const profilesRepo = require("./profiles.repository");

const getMyProfile = async (user) => {
  if (user.role === "TRAINER") {
    return profilesRepo.findTrainerProfile(user.id);
  }
  return profilesRepo.findTraineeProfile(user.id);
};

const updateMyProfile = async (user, data) => {
  if (user.role === "TRAINER") {
    return profilesRepo.upsertTrainerProfile(user.id, data);
  }
  return profilesRepo.upsertTraineeProfile(user.id, data);
};

const ensureProfile = async (user) => {
  let profile =
    user.role === "TRAINER"
      ? await profilesRepo.findTrainerProfile(user.id)
      : await profilesRepo.findTraineeProfile(user.id);
  if (!profile) {
    profile =
      user.role === "TRAINER"
        ? await profilesRepo.upsertTrainerProfile(user.id, { fullName: user.name || "Trainer" })
        : await profilesRepo.upsertTraineeProfile(user.id, { fullName: user.name || "Trainee" });
  }
  return profile;
};

const profileConfig = {
  TRAINEE: {
    idField: "traineeProfileId",
    relation: "traineeProfile",
  },
  TRAINER: {
    idField: "trainerProfileId",
    relation: "trainerProfile",
  },
};

const addChild = async (user, model, data) => {
  const profile = await ensureProfile(user);
  const { idField } = profileConfig[user.role];
  return profilesRepo.createChild(model, { [idField]: profile.id, ...data });
};

const removeChild = async (user, model, childId) => {
  const profile = await ensureProfile(user);
  const { idField } = profileConfig[user.role];
  const result = await profilesRepo.deleteChild(model, childId, idField, profile.id);
  if (result.count === 0) {
    throw new ApiError(404, "Item not found", "NOT_FOUND");
  }
  return { deleted: true };
};

const listChildren = async (user, model) => {
  const profile = await ensureProfile(user);
  return profilesRepo.findChildren(model, profile.id, profileConfig[user.role].idField);
};

const addInterest = async (user, data) => {
  if (user.role !== "TRAINEE") {
    throw new ApiError(403, "Only trainees can add interests", "INSUFFICIENT_ROLE");
  }
  return addChild(user, "interest", data);
};

const addTrainerCompetency = async (user, { competencyId }) => {
  if (user.role !== "TRAINER") {
    throw new ApiError(403, "Only trainers can add competencies", "INSUFFICIENT_ROLE");
  }
  const profile = await ensureProfile(user);
  return profilesRepo.createTrainerCompetency({
    trainerProfileId: profile.id,
    competencyId,
  });
};

const removeTrainerCompetency = async (user, id) => {
  if (user.role !== "TRAINER") {
    throw new ApiError(403, "Only trainers can remove competencies", "INSUFFICIENT_ROLE");
  }
  const profile = await ensureProfile(user);
  const result = await profilesRepo.deleteTrainerCompetency(id, profile.id);
  if (result.count === 0) {
    throw new ApiError(404, "Competency not found", "NOT_FOUND");
  }
  return { deleted: true };
};

const getTrainerProfilePublic = async (userId) => {
  const profile = await profilesRepo.findTrainerProfilePublic(userId);
  if (!profile) {
    throw new ApiError(404, "Trainer profile not found", "NOT_FOUND");
  }
  return profile;
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  addChild,
  removeChild,
  listChildren,
  addInterest,
  addTrainerCompetency,
  removeTrainerCompetency,
  getTrainerProfilePublic,
};
