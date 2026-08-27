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

const deleteCourseFeedback = async (courseId, userId) => {
  return prisma.feedback.deleteMany({
    where: { courseId, userId },
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

const deleteTrainerFeedback = async (courseId, trainerId, traineeId) => {
  return prisma.trainerFeedback.deleteMany({
    where: { courseId, trainerId, traineeId },
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

const createResourceFeedback = async (data) => {
  return prisma.resourceFeedback.create({
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const updateResourceFeedback = async (id, userId, data) => {
  return prisma.resourceFeedback.updateMany({
    where: { id, userId },
    data: { rating: data.rating, comment: data.comment },
  });
};

const deleteResourceFeedback = async (id, userId) => {
  return prisma.resourceFeedback.deleteMany({
    where: { id, userId },
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

const updateAssessmentComment = async (id, userId, data) => {
  return prisma.assessmentComment.updateMany({
    where: { id, userId },
    data: { comment: data.comment, isGrievance: data.isGrievance },
  });
};

const deleteAssessmentComment = async (id, userId) => {
  return prisma.assessmentComment.deleteMany({
    where: { id, userId },
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
  deleteCourseFeedback,
  upsertTrainerFeedback,
  deleteTrainerFeedback,
  findTrainerCourseFeedback,
  findTrainerOverallRating,
  createResourceFeedback,
  updateResourceFeedback,
  deleteResourceFeedback,
  findResourceFeedback,
  createAssessmentComment,
  updateAssessmentComment,
  deleteAssessmentComment,
  findAssessmentComments,
};
