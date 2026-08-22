const { prisma } = require("../../database/prisma");

const findPublished = async ({ page, limit }) => {
  const skip = (page - 1) * limit;
  const where = { status: "PUBLISHED" };
  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: { author: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
};

const create = async (data) => {
  return prisma.announcement.create({ data });
};

const publish = async (id) => {
  return prisma.announcement.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
};

module.exports = { findPublished, create, publish };
