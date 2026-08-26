const { prisma } = require("../../database/prisma");

const findById = async (id, includeAnswers = false) => {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      course: true,
      questions: {
        include: {
          options: {
            select: {
              id: true,
              text: true,
              isCorrect: includeAnswers,
            },
          },
        },
      },
    },
  });
};

const findByCourse = async (courseId) => {
  return prisma.assessment.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });
};

const create = async (data) => {
  const { questions, ...assessmentData } = data;
  if (questions && questions.length > 0) {
    return prisma.assessment.create({
      data: {
        ...assessmentData,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            marks: q.marks,
            order: q.order,
            options: {
              create: q.options,
            },
          })),
        },
      },
      include: {
        questions: { include: { options: true } },
      },
    });
  }
  return prisma.assessment.create({
    data: assessmentData,
    include: {
      questions: { include: { options: true } },
    },
  });
};

const update = async (id, data) => {
  return prisma.assessment.update({ where: { id }, data });
};

const publish = async (id) => {
  return prisma.assessment.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
};

const findSubmission = async (assessmentId, traineeId) => {
  return prisma.submission.findUnique({
    where: { assessmentId_traineeId: { assessmentId, traineeId } },
    include: { answers: true, trainee: true },
  });
};

const findSubmissionById = async (submissionId) => {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assessment: true, trainee: true },
  });
};

const createSubmission = async (data) => {
  return prisma.submission.create({ data, include: { answers: true, trainee: true } });
};

const updateSubmission = async (submissionId, data) => {
  return prisma.submission.update({
    where: { id: submissionId },
    data,
    include: { answers: true, trainee: true },
  });
};

const upsertAnswer = async (submissionId, questionId, selectedOptionId, tx) => {
  const client = tx || prisma;
  return client.answer.upsert({
    where: { submissionId_questionId: { submissionId, questionId } },
    create: { submissionId, questionId, selectedOptionId },
    update: { selectedOptionId },
  });
};

const gradeSubmission = async (submissionId, score, feedback, tx) => {
  const client = tx || prisma;
  return client.submission.update({
    where: { id: submissionId },
    data: {
      status: "GRADED",
      score,
      feedback: feedback || null,
      gradedAt: new Date(),
    },
  });
};

const findSubmissionsByAssessment = async (assessmentId, { page = 1, limit = 50 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.submission.findMany({
      where: { assessmentId },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.submission.count({ where: { assessmentId } }),
  ]);
  return { data, meta: { page, limit, total } };
};

module.exports = {
  findById,
  findByCourse,
  create,
  update,
  publish,
  findSubmission,
  findSubmissionById,
  createSubmission,
  updateSubmission,
  upsertAnswer,
  gradeSubmission,
  findSubmissionsByAssessment,
};
