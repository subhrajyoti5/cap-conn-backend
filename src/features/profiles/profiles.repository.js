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

const getDelegate = (client, model) => {
  return client[model] || client[model.charAt(0).toLowerCase() + model.slice(1)];
};

const createChild = async (model, data, tx) => {
  const client = tx || prisma;
  return getDelegate(client, model).create({ data });
};

const deleteChild = async (model, id, profileIdField, profileId, tx) => {
  const client = tx || prisma;
  return getDelegate(client, model).deleteMany({
    where: { id, [profileIdField]: profileId },
  });
};

const findChildren = async (model, profileId, profileIdField) => {
  const modelDelegate = getDelegate(prisma, model);
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

const findTrainerProfilePublic = async (userId) => {
  let profile = await findTrainerProfile(userId);
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "TRAINER") return null;
    profile = {
      id: "temp-profile-id",
      userId: user.id,
      fullName: user.name || "Trainer",
      phone: "",
      bio: "",
      qualifications: [],
      workExperiences: [],
      skills: [],
      trainerCompetencies: [],
    };
  }
  const courses = await prisma.course.findMany({
    where: { trainerId: userId, status: "PUBLISHED" },
    include: { subject: true, enrollments: true },
  });
  return { ...profile, courses };
};

const findTraineeProfilePublic = async (userId) => {
  let profile = await findTraineeProfile(userId);
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "TRAINEE") return null;
    profile = {
      id: "temp-profile-id",
      userId: user.id,
      fullName: user.name || "Trainee",
      phone: "",
      bio: "",
      qualifications: [],
      workExperiences: [],
      skills: [],
      interests: [],
    };
  }
  return profile;
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
  findTrainerProfilePublic,
  findTraineeProfilePublic,
};
