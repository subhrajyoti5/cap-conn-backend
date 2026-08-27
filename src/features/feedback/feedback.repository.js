const { prisma } = require("../../database/prisma");

const findCourseFeedback = async (courseId) => {
  const feedbacks = await prisma.feedback.findMany({
    where: { courseId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = feedbacks.length;
  const avgRating =
    totalCount > 0
      ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1))
      : 0;

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => {
    if (breakdown[f.rating] !== undefined) breakdown[f.rating]++;
  });

  return { feedbacks, avgRating, totalCount, breakdown };
};

const upsertCourseFeedback = async (data) => {
  return prisma.feedback.upsert({
    where: { courseId_userId: { courseId: data.courseId, userId: data.userId } },
    create: data,
    update: { rating: data.rating, comment: data.comment },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const upsertTrainerFeedback = async (data) => {
  return prisma.trainerFeedback.upsert({
    where: {
      courseId_trainerId_traineeId: {
        courseId: data.courseId,
        trainerId: data.trainerId,
        traineeId: data.traineeId,
      },
    },
    create: data,
    update: { rating: data.rating, comment: data.comment },
  });
};

const findTrainerCourseFeedback = async (courseId, trainerId) => {
  const items = await prisma.trainerFeedback.findMany({
    where: { courseId, trainerId },
    include: {
      trainee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = items.length;
  const avgRating =
    totalCount > 0
      ? Number((items.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1))
      : 0;

  return { items, avgRating, totalCount };
};

const findTrainerOverallRating = async (trainerId) => {
  const items = await prisma.trainerFeedback.findMany({
    where: { trainerId },
  });
  const totalCount = items.length;
  const avgRating =
    totalCount > 0
      ? Number((items.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1))
      : 0;
  return { avgRating, totalCount };
};

const upsertResourceFeedback = async (data) => {
  return prisma.resourceFeedback.upsert({
    where: {
      resourceId_userId: {
        resourceId: data.resourceId,
        userId: data.userId,
      },
    },
    create: data,
    update: { rating: data.rating, comment: data.comment },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const findResourceFeedback = async (resourceId) => {
  const feedbacks = await prisma.resourceFeedback.findMany({
    where: { resourceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const totalCount = feedbacks.length;
  const avgRating =
    totalCount > 0
      ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1))
      : 0;
  return { feedbacks, avgRating, totalCount };
};

const createAssessmentComment = async (data) => {
  return prisma.assessmentComment.create({
    data,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

const findAssessmentComments = async (assessmentId) => {
  return prisma.assessmentComment.findMany({
    where: { assessmentId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

module.exports = {
  findCourseFeedback,
  upsertCourseFeedback,
  upsertTrainerFeedback,
  findTrainerCourseFeedback,
  findTrainerOverallRating,
  upsertResourceFeedback,
  findResourceFeedback,
  createAssessmentComment,
  findAssessmentComments,
};
