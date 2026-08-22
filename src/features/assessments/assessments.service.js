const { prisma } = require("../../database/prisma");
const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const notificationsRepo = require("../notifications/notifications.repository");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("../enrollments/enrollments.repository");
const assessmentsRepo = require("./assessments.repository");

const validateQuestions = (questions) => {
  for (const q of questions) {
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new ApiError(
        400,
        "Each question must have exactly one correct option",
        "VALIDATION_ERROR"
      );
    }
  }
};

const createAssessment = async (data, trainerId) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (course.trainerId !== trainerId) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }

  validateQuestions(data.questions);
  return assessmentsRepo.create({ ...data, trainerId, status: "DRAFT" });
};

const getAssessment = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, user.role !== "TRAINEE");
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    if (assessment.status !== "PUBLISHED") {
      throw new ApiError(403, "Assessment not published", "ASSESSMENT_CLOSED");
    }
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
      assessment.courseId,
      user.id
    );
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Not enrolled", "INSUFFICIENT_ROLE");
    }
  }

  return assessment;
};

const updateAssessment = async (id, data, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }
  if (assessment.status !== "DRAFT") {
    throw new ApiError(409, "Can only edit draft assessments", "CONFLICT");
  }
  return assessmentsRepo.update(id, data);
};

const publishAssessment = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assessment.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
    await createAuditLog(
      user.id,
      "ASSESSMENT_PUBLISHED",
      "ASSESSMENT",
      id,
      null,
      tx
    );
    return updated;
  });
};

const listCourseAssessments = async (courseId, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
      courseId,
      user.id
    );
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Not enrolled", "INSUFFICIENT_ROLE");
    }
  }

  const assessments = await assessmentsRepo.findByCourse(courseId);
  if (user.role === "TRAINEE") {
    return assessments.filter((a) => a.status === "PUBLISHED");
  }
  return assessments;
};

const startAssessment = async (id, traineeId) => {
  const assessment = await assessmentsRepo.findById(id, false);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (assessment.status !== "PUBLISHED") {
    throw new ApiError(403, "Assessment not published", "ASSESSMENT_CLOSED");
  }
  if (new Date() > assessment.deadline) {
    throw new ApiError(403, "Assessment deadline passed", "ASSESSMENT_CLOSED");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
    assessment.courseId,
    traineeId
  );
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new ApiError(403, "Not enrolled", "INSUFFICIENT_ROLE");
  }

  const existing = await assessmentsRepo.findSubmission(id, traineeId);
  if (existing) return existing;

  return assessmentsRepo.createSubmission({
    assessmentId: id,
    traineeId,
    status: "IN_PROGRESS",
  });
};

const submitAssessment = async (id, traineeId, answers) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (new Date() > assessment.deadline) {
    throw new ApiError(403, "Assessment deadline passed", "ASSESSMENT_CLOSED");
  }

  const submission = await assessmentsRepo.findSubmission(id, traineeId);
  if (!submission) {
    throw new ApiError(404, "Submission not found", "NOT_FOUND");
  }
  if (submission.status === "GRADED") {
    throw new ApiError(409, "Already submitted", "CONFLICT");
  }

  return prisma.$transaction(async (tx) => {
    for (const { questionId, selectedOptionId } of answers) {
      await assessmentsRepo.upsertAnswer(
        submission.id,
        questionId,
        selectedOptionId,
        tx
      );
    }

    let score = 0;
    for (const question of assessment.questions) {
      const correctOption = question.options.find((o) => o.isCorrect);
      const answer = answers.find((a) => a.questionId === question.id);
      if (answer && correctOption && answer.selectedOptionId === correctOption.id) {
        score += question.marks;
      }
    }

    const graded = await assessmentsRepo.gradeSubmission(
      submission.id,
      score,
      tx
    );

    await notificationsRepo.createNotification(
      {
        userId: traineeId,
        type: "ASSESSMENT",
        title: "Assessment Graded",
        body: `You scored ${score}/${assessment.totalMarks} on ${assessment.title}`,
      },
      tx
    );

    return graded;
  });
};

const getResult = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    const submission = await assessmentsRepo.findSubmission(id, user.id);
    if (!submission || submission.status !== "GRADED") {
      throw new ApiError(404, "Result not found", "NOT_FOUND");
    }
    return { assessment, submission };
  }

  if (user.role === "TRAINER" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }

  const submissions = await assessmentsRepo.findSubmissionsByAssessment(id, {
    page: 1,
    limit: 100,
  });
  return { assessment, submissions: submissions.data };
};

const listSubmissions = async (id, user, query) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role === "TRAINER" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }
  return assessmentsRepo.findSubmissionsByAssessment(id, query);
};

module.exports = {
  createAssessment,
  getAssessment,
  updateAssessment,
  publishAssessment,
  listCourseAssessments,
  startAssessment,
  submitAssessment,
  getResult,
  listSubmissions,
};
