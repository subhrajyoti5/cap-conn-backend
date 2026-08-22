const { prisma } = require("../../database/prisma");

const findUserByClerkId = async (clerkUserId) => {
  return prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      traineeProfile: true,
      trainerProfile: true,
    },
  });
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const createUser = async (data) => {
  return prisma.user.create({ data });
};

const deleteUserByClerkId = async (clerkUserId) => {
  return prisma.user.delete({ where: { clerkUserId } });
};

module.exports = {
  findUserByClerkId,
  findUserByEmail,
  createUser,
  deleteUserByClerkId,
};
