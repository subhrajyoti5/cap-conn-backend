const { prisma } = require("../../database/prisma");

const findByCourse = async (courseId, { page, limit }) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.feedback.findMany({
      where: { courseId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.feedback.count({ where: { courseId } }),
  ]);
  return { data, meta: { page, limit, total } };
};

const upsert = async (data) => {
  return prisma.feedback.upsert({
    where: { courseId_userId: { courseId: data.courseId, userId: data.userId } },
    create: data,
    update: { rating: data.rating, comment: data.comment },
  });
};

module.exports = { findByCourse, upsert };
