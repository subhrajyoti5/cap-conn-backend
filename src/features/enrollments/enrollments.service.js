const { ApiError } = require("../../utils/ApiError");
const { prisma } = require("../../database/prisma");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("./enrollments.repository");
const notificationsService = require("../notifications/notifications.service");

const isCourseInstructor = async (courseId, userId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) return false;
  if (course.trainerId === userId) return true;

  const secondary = await prisma.courseTrainer.findUnique({
    where: {
      courseId_trainerId: {
        courseId,
        trainerId: userId,
      }
    }
  });
  return !!secondary;
};

const enrollInCourse = async (courseId, traineeId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (!["PUBLISHED", "ACTIVE"].includes(course.status)) {
    throw new ApiError(409, "Course is not open for enrollment", "CONFLICT");
  }

  const user = await prisma.user.findUnique({ where: { id: traineeId } });
  if (!user || user.role !== "TRAINEE") {
    throw new ApiError(403, "Only trainees can enroll in courses", "INSUFFICIENT_ROLE");
  }

  const existing = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);

  let enrollment;
  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new ApiError(409, "Already enrolled", "ALREADY_ENROLLED");
    }
    if (existing.status === "PENDING") {
      throw new ApiError(409, "Enrollment request is already pending approval", "PENDING_ENROLLMENT");
    }
    enrollment = await enrollmentsRepo.updateStatus(courseId, traineeId, "PENDING");
  } else {
    enrollment = await enrollmentsRepo.create({
      courseId,
      traineeId,
      status: "PENDING",
    });
  }

  const secondaries = await prisma.courseTrainer.findMany({
    where: { courseId },
    select: { trainerId: true }
  });
  const trainerIds = [course.trainerId, ...secondaries.map(s => s.trainerId)];

  await notificationsService.bulkCreate({
    userIds: trainerIds,
    type: "APPROVAL",
    title: "New Enrollment Request",
    body: `${user.name || user.email} requested to enroll in course "${course.title}".`,
  });

  return enrollment;
};

const approveEnrollment = async (courseId, traineeId, trainerId) => {
  const isInstructor = await isCourseInstructor(courseId, trainerId);
  if (!isInstructor) {
    throw new ApiError(403, "Only course instructors can approve enrollments", "NOT_OWNER");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);
  if (!enrollment) throw new ApiError(404, "Enrollment request not found", "NOT_FOUND");
  if (enrollment.status !== "PENDING") {
    throw new ApiError(400, "Enrollment is not pending", "BAD_REQUEST");
  }

  const updated = await enrollmentsRepo.updateStatus(courseId, traineeId, "ACTIVE");
  const course = await coursesRepo.findById(courseId);

  await notificationsService.bulkCreate({
    userIds: [traineeId],
    type: "COURSE",
    title: "Enrollment Request Approved",
    body: `Your request to join the course "${course.title}" has been approved. You now have access!`,
  });

  return updated;
};

const rejectEnrollment = async (courseId, traineeId, trainerId, message) => {
  const isInstructor = await isCourseInstructor(courseId, trainerId);
  if (!isInstructor) {
    throw new ApiError(403, "Only course instructors can reject enrollments", "NOT_OWNER");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);
  if (!enrollment) throw new ApiError(404, "Enrollment request not found", "NOT_FOUND");
  if (enrollment.status !== "PENDING") {
    throw new ApiError(400, "Enrollment is not pending", "BAD_REQUEST");
  }

  const updated = await enrollmentsRepo.updateStatus(courseId, traineeId, "REJECTED");
  const course = await coursesRepo.findById(courseId);

  await notificationsService.bulkCreate({
    userIds: [traineeId],
    type: "COURSE",
    title: "Enrollment Request Rejected",
    body: `Your request to join the course "${course.title}" was rejected.${message ? ` Message: ${message}` : ""}`,
  });

  return updated;
};

const removeTrainee = async (courseId, traineeId, trainerId, reason) => {
  const isInstructor = await isCourseInstructor(courseId, trainerId);
  if (!isInstructor) {
    throw new ApiError(403, "Only course instructors can remove trainees", "NOT_OWNER");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found", "NOT_FOUND");

  const updated = await enrollmentsRepo.updateStatus(courseId, traineeId, "DROPPED");
  const course = await coursesRepo.findById(courseId);

  await notificationsService.bulkCreate({
    userIds: [traineeId],
    type: "COURSE",
    title: "Removed from Course",
    body: `You have been removed from the course "${course.title}" by the instructor.${reason ? ` Reason: ${reason}` : ""}`,
  });

  return updated;
};

const dropCourse = async (courseId, traineeId) => {
  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found", "NOT_FOUND");
  return enrollmentsRepo.updateStatus(courseId, traineeId, "DROPPED");
};

const listMyEnrollments = async (traineeId, query) => {
  return enrollmentsRepo.findByTrainee(traineeId, query);
};

const listCourseEnrollments = async (courseId, user) => {
  const isInstructor = await isCourseInstructor(courseId, user.id);
  if (user.role !== "ADMIN" && !isInstructor) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }
  return enrollmentsRepo.findByCourse(courseId);
};

module.exports = {
  isCourseInstructor,
  enrollInCourse,
  approveEnrollment,
  rejectEnrollment,
  removeTrainee,
  dropCourse,
  listMyEnrollments,
  listCourseEnrollments,
};
