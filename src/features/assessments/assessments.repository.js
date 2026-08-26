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

const findByCourse = async (courseId, isStaff = false) => {
  const where = { courseId };
  if (!isStaff) {
    where.status = "PUBLISHED";
  }

  return prisma.assessment.findMany({
    where,
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      submissions: {
        include: {
          trainee: {
            select: {
              id: true,
              email: true,
              traineeProfile: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const create = async (data) => {
  const { questions, ...assessmentData } = data;
  return prisma.assessment.create({
    data: {
      ...assessmentData,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          explanation: q.explanation || null,
          imageUrl: q.imageUrl || null,
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
};

const update = async (id, data) => {
  const { questions, ...assessmentData } = data;

  if (!questions) {
    return prisma.assessment.update({ where: { id }, data: assessmentData });
  }

  return prisma.$transaction(async (tx) => {
    const submissionCount = await tx.submission.count({ where: { assessmentId: id } });

    if (submissionCount === 0) {
      const existingQuestions = await tx.question.findMany({
        where: { assessmentId: id },
        select: { id: true },
      });
      const questionIds = existingQuestions.map((q) => q.id);

      if (questionIds.length > 0) {
        await tx.answer.deleteMany({
          where: { questionId: { in: questionIds } },
        });
        await tx.question.deleteMany({
          where: { assessmentId: id },
        });
      }

      return tx.assessment.update({
        where: { id },
        data: {
          ...assessmentData,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              explanation: q.explanation || null,
              imageUrl: q.imageUrl || null,
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

    // If submissions exist, update assessment metadata & existing questions in-place to PRESERVE all submission details
    await tx.assessment.update({
      where: { id },
      data: assessmentData,
    });

    const existingQuestions = await tx.question.findMany({
      where: { assessmentId: id },
      include: { options: true },
      orderBy: { order: "asc" },
    });

    for (let i = 0; i < questions.length; i++) {
      const qInput = questions[i];
      const existingQ = existingQuestions[i];

      if (existingQ) {
        await tx.question.update({
          where: { id: existingQ.id },
          data: {
            text: qInput.text,
            explanation: qInput.explanation || null,
            imageUrl: qInput.imageUrl || null,
            marks: qInput.marks,
            order: i,
          },
        });

        await tx.option.deleteMany({ where: { questionId: existingQ.id } });
        await tx.option.createMany({
          data: qInput.options.map((opt) => ({
            questionId: existingQ.id,
            text: opt.text,
            isCorrect: Boolean(opt.isCorrect),
          })),
        });
      } else {
        await tx.question.create({
          data: {
            assessmentId: id,
            text: qInput.text,
            explanation: qInput.explanation || null,
            imageUrl: qInput.imageUrl || null,
            marks: qInput.marks,
            order: i,
            options: {
              create: qInput.options.map((opt) => ({
                text: opt.text,
                isCorrect: Boolean(opt.isCorrect),
              })),
            },
          },
        });
      }
    }

    return tx.assessment.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
  });
};

const publish = async (id) => {
  return prisma.assessment.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
};

const remove = async (id) => {
  return prisma.assessment.delete({
    where: { id },
  });
};

const findSubmission = async (assessmentId, traineeId) => {
  return prisma.submission.findUnique({
    where: { assessmentId_traineeId: { assessmentId, traineeId } },
    include: { answers: true },
  });
};

const createSubmission = async (data) => {
  return prisma.submission.create({ data, include: { answers: true } });
};

const upsertAnswer = async (submissionId, questionId, selectedOptionId, tx) => {
  const client = tx || prisma;
  return client.answer.upsert({
    where: { submissionId_questionId: { submissionId, questionId } },
    create: { submissionId, questionId, selectedOptionId },
    update: { selectedOptionId },
  });
};

const gradeSubmission = async (submissionId, score, tx) => {
  const client = tx || prisma;
  return client.submission.update({
    where: { id: submissionId },
    data: { status: "GRADED", score, submittedAt: new Date() },
  });
};

const findSubmissionsByAssessment = async (assessmentId, { page = 1, limit = 100 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.submission.findMany({
      where: { assessmentId },
      include: {
        trainee: {
          select: {
            id: true,
            email: true,
            traineeProfile: {
              select: { fullName: true },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
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
  remove,
  findSubmission,
  createSubmission,
  upsertAnswer,
  gradeSubmission,
  findSubmissionsByAssessment,
};
