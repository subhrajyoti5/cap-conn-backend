const { prisma } = require("../../database/prisma");

const findTraineeProfile = async (userId) => {
  return prisma.traineeProfile.findUnique({
    where: { userId },
    include: {
      qualifications: true,
      workExperiences: true,
      skills: true,
      interests: true,
    },
  });
};

const findTrainerProfile = async (userId) => {
  return prisma.trainerProfile.findUnique({
    where: { userId },
    include: {
      qualifications: true,
      workExperiences: true,
      skills: true,
      trainerCompetencies: { include: { competency: true } },
    },
  });
};

const upsertTraineeProfile = async (userId, data) => {
  return prisma.traineeProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

const upsertTrainerProfile = async (userId, data) => {
  return prisma.trainerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

const createChild = async (model, data, tx) => {
  const client = tx || prisma;
  return client[model].create({ data });
};

const deleteChild = async (model, id, profileIdField, profileId, tx) => {
  const client = tx || prisma;
  return client[model].deleteMany({
    where: { id, [profileIdField]: profileId },
  });
};

const findChildren = async (model, profileId, profileIdField) => {
  const modelDelegate = prisma[model] || prisma[model.charAt(0).toLowerCase() + model.slice(1)];
  return modelDelegate.findMany({
    where: { [profileIdField]: profileId },
    orderBy: { id: "desc" },
  });
};

const createTrainerCompetency = async (data, tx) => {
  const client = tx || prisma;
  return client.trainerCompetency.create({ data });
};

const deleteTrainerCompetency = async (id, trainerProfileId, tx) => {
  const client = tx || prisma;
  return client.trainerCompetency.deleteMany({
    where: { id, trainerProfileId },
  });
};

module.exports = {
  findTraineeProfile,
  findTrainerProfile,
  upsertTraineeProfile,
  upsertTrainerProfile,
  createChild,
  deleteChild,
  findChildren,
  createTrainerCompetency,
  deleteTrainerCompetency,
};
