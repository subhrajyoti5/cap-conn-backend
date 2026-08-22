const { prisma } = require("../../database/prisma");

const findByUser = async (userId) => {
  return prisma.certification.findMany({
    where: { userId },
    orderBy: { issueDate: "desc" },
  });
};

const findById = async (id) => {
  return prisma.certification.findUnique({ where: { id } });
};

const create = async (data) => {
  return prisma.certification.create({ data });
};

const remove = async (id, userId) => {
  return prisma.certification.deleteMany({ where: { id, userId } });
};

module.exports = { findByUser, findById, create, remove };
