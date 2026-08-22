const { prisma } = require("../../database/prisma");

const findById = async (id) => {
  return prisma.learningResource.findUnique({
    where: { id },
    include: { course: true },
  });
};

const findByCourse = async (courseId) => {
  return prisma.learningResource.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });
};

const create = async (data) => {
  return prisma.learningResource.create({ data });
};

const remove = async (id) => {
  return prisma.learningResource.delete({ where: { id } });
};

module.exports = { findById, findByCourse, create, remove };
