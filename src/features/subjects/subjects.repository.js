const { prisma } = require("../../database/prisma");

const findAll = async () => {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
};

const findById = async (id) => {
  return prisma.subject.findUnique({ where: { id } });
};

const create = async (data) => {
  return prisma.subject.create({ data });
};

module.exports = { findAll, findById, create };
