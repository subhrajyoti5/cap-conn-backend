const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");
const { r2Client } = require("../../config/r2");
const { r2Bucket } = require("../../config/env");
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
  if (!questions || !questions.length) return;
  for (const q of questions) {
    const correctCount = (q.options || []).filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new ApiError(
        400,
        "Each question must have exactly one correct option",
        "VALIDATION_ERROR"
      );
    }
  }
};

const getUploadUrl = async ({ courseId, fileName, mimeType, sizeBytes }, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  // Trainee must be actively enrolled, or user must be trainer/admin
  if (user.role === "TRAINEE") {
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, user.id);
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Not actively enrolled in course", "INSUFFICIENT_ROLE");
    }
  } else if (user.role !== "ADMIN" && course.trainerId !== user.id) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (sizeBytes && sizeBytes > maxSize) {
    throw new ApiError(400, `File exceeds max size of 50MB`, "VALIDATION_ERROR");
  }

  const storageKey = `assessments/${courseId}/${user.id}/${randomUUID()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 3600,
  });

  return { uploadUrl, storageKey };
};

const createAssessment = async (data, user) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && course.trainerId !== user.id) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }

  if (data.type === "MCQ" || (!data.type && data.questions?.length)) {
    if (!data.questions || !data.questions.length) {
      throw new ApiError(400, "MCQ assessment requires at least one question", "VALIDATION_ERROR");
    }
    validateQuestions(data.questions);
  }

  const trainerId = course.trainerId;
  return assessmentsRepo.create({ ...data, trainerId, status: "DRAFT" });
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
    if (!isImageResource(resource)) {
      throw new ApiError(
        400,
        `Resource "${resource.title}" is not an image`,
        "VALIDATION_ERROR"
      );
    }
    resources.push(resource);
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

    const submission = await assessmentsRepo.findSubmission(id, user.id);
    return { ...assessment, mySubmission: submission || null };
  }

  return assessment;
};

const updateAssessment = async (id, data, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }

  return assessmentsRepo.update(id, data);
};

const deleteAssessment = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }

  await assessmentsRepo.remove(id);
  await createAuditLog(
    user.id,
    "ASSESSMENT_DELETED",
    "ASSESSMENT",
    id,
    null
  );
  return { deleted: true };
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

  const isStaff = user.role === "ADMIN" || course.trainerId === user.id;
  const assessments = await assessmentsRepo.findByCourse(courseId, isStaff);
  if (user.role === "TRAINEE") {
    const published = assessments.filter((a) => a.status === "PUBLISHED");
    // Attach trainee submissions
    const enriched = await Promise.all(
      published.map(async (a) => {
        const sub = await assessmentsRepo.findSubmission(a.id, user.id);
        return {
          ...a,
          submission: sub || null,
        };
      })
    );
    return enriched;
  }
  return assessments;
};

const startAssessment = async (id, traineeId) => {
  const assessment = await assessmentsRepo.findById(id, false);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (assessment.status !== "PUBLISHED") {
    throw new ApiError(403, "Assessment not published", "ASSESSMENT_CLOSED");
  }
  if (new Date() > new Date(assessment.deadline)) {
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

  if (new Date() > new Date(assessment.deadline)) {
    throw new ApiError(403, "Assessment deadline passed", "ASSESSMENT_CLOSED");
  }

  const submission = await assessmentsRepo.findSubmission(id, traineeId);
  if (!submission) {
    throw new ApiError(404, "Submission not found", "NOT_FOUND");
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
      null,
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

const submitDocumentAssessment = async (id, traineeId, { fileUrl, fileName, notes }) => {
  const assessment = await assessmentsRepo.findById(id, false);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (new Date() > new Date(assessment.deadline)) {
    throw new ApiError(403, "Assessment deadline passed. Submissions are closed.", "ASSESSMENT_CLOSED");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
    assessment.courseId,
    traineeId
  );
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new ApiError(403, "Not enrolled", "INSUFFICIENT_ROLE");
  }

  const existing = await assessmentsRepo.findSubmission(id, traineeId);
  if (existing) {
    // Allow re-submission before the deadline
    return assessmentsRepo.updateSubmission(existing.id, {
      fileUrl,
      fileName,
      notes: notes || null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    });
  }

  return assessmentsRepo.createSubmission({
    assessmentId: id,
    traineeId,
    fileUrl,
    fileName,
    notes: notes || null,
    status: "SUBMITTED",
    submittedAt: new Date(),
  });
};

const gradeManualSubmission = async (assessmentId, submissionId, { score, feedback }, user) => {
  const assessment = await assessmentsRepo.findById(assessmentId, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }

  if (score > assessment.totalMarks) {
    throw new ApiError(400, `Score cannot exceed total marks (${assessment.totalMarks})`, "VALIDATION_ERROR");
  }

  const submission = await assessmentsRepo.findSubmissionById(submissionId);
  if (!submission || submission.assessmentId !== assessmentId) {
    throw new ApiError(404, "Submission not found for this assessment", "NOT_FOUND");
  }

  const graded = await assessmentsRepo.gradeSubmission(submissionId, score, feedback);

  // Send notification to trainee
  await notificationsRepo.createNotification({
    userId: submission.traineeId,
    type: "ASSESSMENT",
    title: `Assignment Graded: ${assessment.title}`,
    body: `You received a grade of ${score}/${assessment.totalMarks} with feedback on "${assessment.title}".`,
  });

  return graded;
};

const getResult = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    const submission = await assessmentsRepo.findSubmission(id, user.id);
    if (!submission) {
      throw new ApiError(404, "Submission not found", "NOT_FOUND");
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
  if (user.role !== "ADMIN" && assessment.trainerId !== user.id) {
    throw new ApiError(403, "Not assessment owner", "NOT_OWNER");
  }
  return assessmentsRepo.findSubmissionsByAssessment(id, query);
};

module.exports = {
  getUploadUrl,
  createAssessment,
  generateAiQuestions,
  getAssessment,
  updateAssessment,
  publishAssessment,
  deleteAssessment,
  listCourseAssessments,
  startAssessment,
  submitAssessment,
  submitDocumentAssessment,
  gradeManualSubmission,
  getResult,
  listSubmissions,
};
