const { prisma } = require("../../database/prisma");

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      traineeProfile: true,
      trainerProfile: true,
    },
  });
};

const createUser = async (data) => {
  return prisma.user.create({ data });
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
