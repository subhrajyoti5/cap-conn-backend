const { prisma } = require("../../database/prisma");

const findAll = async (subjectId) => {
  const where = {};
  if (subjectId) where.subjectId = subjectId;
  return prisma.competency.findMany({
    where,
    include: { subject: true },
    orderBy: { name: "asc" },
  });
};

const findById = async (id) => {
  return prisma.competency.findUnique({ where: { id } });
};

const findBySubject = async (subjectId) => {
  return prisma.competency.findMany({ where: { subjectId } });
};

const create = async (data) => {
  return prisma.competency.create({ data });
};

const findTrainers = async () => {
  return prisma.user.findMany({
    where: { role: "TRAINER", status: "APPROVED" },
    include: {
      trainerProfile: {
        include: {
          trainerCompetencies: { include: { competency: true } },
        },
      },
    },
  });
};

module.exports = {
  findAll,
  findById,
  findBySubject,
  create,
  findTrainers,
};
