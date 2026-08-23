const { prisma } = require("../../database/prisma");

const findByCourseAndTrainee = async (courseId, traineeId) => {
  return prisma.enrollment.findUnique({
    where: { courseId_traineeId: { courseId, traineeId } },
  });
};

const create = async (data) => {
  return prisma.enrollment.create({ data });
};

const updateStatus = async (courseId, traineeId, status) => {
  return prisma.enrollment.update({
    where: { courseId_traineeId: { courseId, traineeId } },
    data: { status },
  });
};

const findByTrainee = async (traineeId, { status, page, limit }) => {
  const where = { traineeId };
  if (status) where.status = status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { course: { include: { trainer: true, subject: true } } },
      orderBy: { enrolledAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where }),
  ]);

  return { data, meta: { page, limit, total } };
};

const findByCourse = async (courseId) => {
  return prisma.enrollment.findMany({
    where: { courseId },
    include: {
      trainee: {
        select: { id: true, name: true, email: true, role: true, status: true },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
};

module.exports = {
  findByCourseAndTrainee,
  create,
  updateStatus,
  findByTrainee,
  findByCourse,
};
