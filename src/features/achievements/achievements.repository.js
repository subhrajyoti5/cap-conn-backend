const { prisma } = require("../../database/prisma");

const findAll = async ({ page, limit }) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.achievement.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.achievement.count(),
  ]);
  return { data, meta: { page, limit, total } };
};

const create = async (data) => {
  return prisma.achievement.create({ data });
};

module.exports = { findAll, create };
