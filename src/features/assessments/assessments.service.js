const { prisma } = require("../../database/prisma");
const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const notificationsRepo = require("../notifications/notifications.repository");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("../enrollments/enrollments.repository");
const resourcesRepo = require("../resources/resources.repository");
const assessmentsRepo = require("./assessments.repository");
const aiService = require("./ai.service");

const IMAGE_MIME_RE = /^image\//i;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

const isImageResource = (resource) => {
  if (resource.mimeType && IMAGE_MIME_RE.test(resource.mimeType)) return true;
  const key = resource.storageKey || "";
  return IMAGE_EXT_RE.test(key);
};

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

const notifyEnrolledTrainees = async (assessment, tx) => {
  const client = tx || prisma;
  const enrollments = await client.enrollment.findMany({
    where: { courseId: assessment.courseId, status: "ACTIVE" },
    select: { traineeId: true },
  });

  const notifications = enrollments.map((e) => ({
    userId: e.traineeId,
    type: "ASSESSMENT",
    title: "New Assignment Available",
    body: `A new assignment "${assessment.title}" has been published in your course.`,
  }));

  if (notifications.length > 0) {
    await client.notification.createMany({ data: notifications });
  }
};

const createAssessment = async (data, user) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && course.trainerId !== user.id) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }

  validateQuestions(data.questions);
  const trainerId = course.trainerId;
  const created = await assessmentsRepo.create({ ...data, trainerId, status: data.status || "DRAFT" });

  if (created.status === "PUBLISHED") {
    await notifyEnrolledTrainees(created);
  }
  return created;
};

const generateAiQuestions = async (courseId, body, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && course.trainerId !== user.id) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }

  const uniqueIds = [...new Set(body.resourceIds || [])];
  const resources = [];
  for (const resourceId of uniqueIds) {
    const resource = await resourcesRepo.findById(resourceId);
    if (!resource || resource.courseId !== courseId) {
      throw new ApiError(
        400,
        `Resource ${resourceId} not found on this course`,
        "VALIDATION_ERROR"
      );
    }
    if (isImageResource(resource)) {
      resources.push(resource);
    }
  }

  return aiService.generateMcqFromImages({
    resources,
    questionCount: body.questionCount,
    customInstructions: body.customInstructions,
    theoryText: body.theoryText,
    marksPerQuestion: body.marksPerQuestion,
  });
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
  if (data.questions) {
    validateQuestions(data.questions);
  }
  const isPublishingNow = assessment.status === "DRAFT" && data.status === "PUBLISHED";
  const updated = await assessmentsRepo.update(id, data);

  if (isPublishingNow || updated.status === "PUBLISHED") {
    await notifyEnrolledTrainees(updated);
  }
  return updated;
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
    await notifyEnrolledTrainees(updated, tx);
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

  const isStaff = user.role === "ADMIN" || course.trainerId === user.id;
  const assessments = await assessmentsRepo.findByCourse(courseId, isStaff);
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
  if (assessment.startTime && new Date() < new Date(assessment.startTime)) {
    throw new ApiError(403, "Assessment has not started yet (Upcoming)", "ASSESSMENT_UPCOMING");
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
    if (assessment.evaluationMode === "MANUAL_RELEASE" && !assessment.resultsReleased) {
      throw new ApiError(
        403,
        "Results have not been released by the trainer yet",
        "RESULTS_PENDING_RELEASE"
      );
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

const deleteAssessment = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }
  return assessmentsRepo.remove(id);
};

module.exports = {
  createAssessment,
  generateAiQuestions,
  getAssessment,
  updateAssessment,
  publishAssessment,
  deleteAssessment,
  listCourseAssessments,
  startAssessment,
  submitAssessment,
  getResult,
  listSubmissions,
};
