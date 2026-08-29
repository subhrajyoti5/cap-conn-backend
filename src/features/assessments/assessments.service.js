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

const isCourseStaff = async (courseOrId, user) => {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "TRAINER") return false;

  let course = null;
  if (typeof courseOrId === "string") {
    course = await coursesRepo.findById(courseOrId);
  } else {
    course = courseOrId;
  }
  if (!course) return false;

  if (course.trainerId === user.id) return true;
  if (course.trainers && course.trainers.some((ct) => ct.trainerId === user.id || ct.trainer?.id === user.id)) {
    return true;
  }

  const courseId = course.id;
  const ct = await prisma.courseTrainer.findFirst({
    where: { courseId, trainerId: user.id },
  });
  return !!ct;
};

const ensureCourseNotSuspended = async (courseOrId, user) => {
  if (!user || user.role === "ADMIN") return;
  let course = null;
  if (typeof courseOrId === "string") {
    course = await coursesRepo.findById(courseOrId);
  } else {
    course = courseOrId;
  }
  if (course && course.status === "SUSPENDED") {
    throw new ApiError(
      403,
      "This course is currently suspended by the platform administrator. Actions are locked.",
      "COURSE_SUSPENDED"
    );
  }
};

const getUploadUrl = async ({ courseId, fileName, mimeType, sizeBytes }, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, user.id);
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Not actively enrolled in course", "INSUFFICIENT_ROLE");
    }
  } else if (!(await isCourseStaff(course, user))) {
    throw new ApiError(403, "Not course owner or co-trainer", "NOT_OWNER");
  }

  await ensureCourseNotSuspended(course, user);

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
  if (!(await isCourseStaff(course, user))) {
    throw new ApiError(403, "Not course owner or co-trainer", "NOT_OWNER");
  }
  await ensureCourseNotSuspended(course, user);

  if (data.type === "MCQ" || (!data.type && data.questions?.length)) {
    if (!data.questions || !data.questions.length) {
      throw new ApiError(400, "MCQ assessment requires at least one question", "VALIDATION_ERROR");
    }
    validateQuestions(data.questions);
  }

  const created = await assessmentsRepo.create({ ...data, trainerId: user.id, status: data.status || "DRAFT" });

  if (created.status === "PUBLISHED") {
    await notifyEnrolledTrainees(created);
  }
  return created;
};

const generateAiQuestions = async (courseId, body, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (!(await isCourseStaff(course, user))) {
    throw new ApiError(403, "Not course owner or co-trainer", "NOT_OWNER");
  }
  await ensureCourseNotSuspended(course, user);

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

    const submission = await assessmentsRepo.findSubmission(id, user.id);
    return { ...assessment, mySubmission: submission || null };
  }

  return assessment;
};

const updateAssessment = async (id, data, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (!(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
  }
  await ensureCourseNotSuspended(assessment.courseId, user);

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

const deleteAssessment = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (!(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
  }
  await ensureCourseNotSuspended(assessment.courseId, user);

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
  if (!(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
  }
  await ensureCourseNotSuspended(assessment.courseId, user);

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

  const isStaff = await isCourseStaff(course, user);
  const assessments = await assessmentsRepo.findByCourse(courseId, isStaff);
  if (user.role === "TRAINEE") {
    const published = assessments.filter((a) => a.status === "PUBLISHED");
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
  if (assessment.startTime && new Date() < new Date(assessment.startTime)) {
    throw new ApiError(403, "Assessment has not started yet (Upcoming)", "ASSESSMENT_UPCOMING");
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

  return assessmentsRepo.createSubmission(id, traineeId);
};

const submitAssessment = async (id, traineeId, answers) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (new Date() > new Date(assessment.deadline)) {
    throw new ApiError(403, "Assessment deadline passed", "ASSESSMENT_CLOSED");
  }

  const existing = await assessmentsRepo.findSubmission(id, traineeId);
  if (existing && (existing.status === "SUBMITTED" || existing.status === "GRADED")) {
    throw new ApiError(409, "Already submitted", "CONFLICT");
  }

  return prisma.$transaction(async (tx) => {
    let submission = existing;
    if (!submission) {
      submission = await assessmentsRepo.createSubmission(id, traineeId, tx);
    }

    if (answers && answers.length) {
      for (const ans of answers) {
        await assessmentsRepo.upsertAnswer(
          submission.id,
          ans.questionId,
          ans.selectedOptionId,
          tx
        );
      }
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

const submitDocumentAssessment = async (id, traineeId, data) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (new Date() > new Date(assessment.deadline)) {
    throw new ApiError(403, "Assessment deadline passed", "ASSESSMENT_CLOSED");
  }

  const existing = await assessmentsRepo.findSubmission(id, traineeId);
  if (existing && (existing.status === "SUBMITTED" || existing.status === "GRADED")) {
    throw new ApiError(409, "Already submitted", "CONFLICT");
  }

  const submission = existing || (await assessmentsRepo.createSubmission(id, traineeId));
  return assessmentsRepo.updateSubmission(submission.id, {
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    notes: data.notes || null,
    status: "SUBMITTED",
    submittedAt: new Date(),
  });
};

const getResult = async (id, user) => {
  const assessment = await assessmentsRepo.findById(id, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");

  if (user.role === "TRAINEE") {
    const submission = await assessmentsRepo.findSubmission(id, user.id);
    if (!submission || (submission.status !== "GRADED" && submission.status !== "SUBMITTED")) {
      throw new ApiError(404, "Result not found", "NOT_FOUND");
    }
    if (assessment.evaluationMode === "MANUAL_RELEASE" && !assessment.resultsReleased) {
      throw new ApiError(
        403,
        "Results have not been released by the trainer yet",
        "RESULTS_PENDING_RELEASE"
      );
    }

    const canViewDetailedAnswers =
      assessment.evaluationMode === "INSTANT" ||
      assessment.resultsReleased === true;

    if (!canViewDetailedAnswers) {
      return {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          totalMarks: assessment.totalMarks,
          evaluationMode: assessment.evaluationMode,
          resultsReleased: false,
        },
        submission: {
          id: submission.id,
          status: submission.status,
          score: null, // Hidden until released
          submittedAt: submission.submittedAt,
        },
      };
    }

    return { assessment, submission };
  }

  if (user.role === "TRAINER" && !(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
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
  if (user.role === "TRAINER" && !(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
  }
  return assessmentsRepo.findSubmissionsByAssessment(id, query);
};

const gradeManualSubmission = async (assessmentId, submissionId, data, user) => {
  const assessment = await assessmentsRepo.findById(assessmentId, true);
  if (!assessment) throw new ApiError(404, "Assessment not found", "NOT_FOUND");
  if (user.role === "TRAINER" && !(await isCourseStaff(assessment.courseId, user))) {
    throw new ApiError(403, "Not assessment owner or co-trainer", "NOT_OWNER");
  }

  const submission = await assessmentsRepo.gradeSubmission(
    submissionId,
    data.score,
    prisma,
    data.feedback || null
  );

  await notificationsRepo.createNotification({
    userId: submission.traineeId,
    type: "ASSESSMENT",
    title: "Assessment Graded",
    body: `Your submission for "${assessment.title}" has been graded: ${data.score}/${assessment.totalMarks}. ${data.feedback ? `Feedback: ${data.feedback}` : ""}`,
  });

  return submission;
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
  getResult,
  listSubmissions,
  gradeManualSubmission,
};
