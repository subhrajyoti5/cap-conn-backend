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

const createMany = async (certificationsData) => {
  return prisma.certification.createMany({
    data: certificationsData,
  });
};

const findDistributed = async (user) => {
  let where = {};
  if (user.role === "ADMIN") {
    where = { OR: [{ issuerId: { not: null } }, { NOT: { templateData: null } }, { NOT: { issuer: "" } }] };
  } else {
    // For trainers, return all certificates issued by them OR any custom issued certificates with templateData/issuerId
    where = {
      OR: [
        { issuerId: user.id },
        { NOT: { templateData: null } },
        ...(user.name ? [{ issuer: { contains: user.name } }] : []),
      ],
    };
  }
  return prisma.certification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const remove = async (id, userId) => {
  return prisma.certification.deleteMany({ where: { id, userId } });
};

module.exports = { findByUser, findById, findDistributed, create, createMany, remove };

