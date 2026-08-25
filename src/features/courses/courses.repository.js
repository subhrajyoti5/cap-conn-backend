const { prisma } = require("../../database/prisma");

const findById = async (id) => {
  return prisma.course.findUnique({
    where: { id },
    include: {
      trainer: { select: { id: true, name: true, email: true, role: true } },
      subject: true,
      resources: true,
      assessments: {
        include: {
          questions: {
            include: { options: true },
          },
        },
      },
      enrollments: {
        include: {
          trainee: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      feedbacks: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
};

const findCourses = async ({ subjectId, trainerId, status, search, page, limit }) => {
  const where = {};
  if (subjectId) where.subjectId = subjectId;
  if (trainerId) where.trainerId = trainerId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { trainer: true, subject: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return { data, meta: { page, limit, total } };
};

const create = async (data) => {
  return prisma.course.create({ data });
};

const update = async (id, data) => {
  return prisma.course.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.course.delete({ where: { id } });
};

const countEnrollments = async (courseId) => {
  return prisma.enrollment.count({ where: { courseId, status: { not: "DROPPED" } } });
};

module.exports = {
  findById,
  findCourses,
  create,
  update,
  remove,
  countEnrollments,
};
