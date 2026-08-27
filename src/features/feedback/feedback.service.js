const { ApiError } = require("../../utils/ApiError");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("../enrollments/enrollments.repository");
const feedbackRepo = require("./feedback.repository");

const createCourseFeedback = async (data, user) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  // Allow trainees enrolled in the course, or trainers/admins
  if (user.role === "TRAINEE") {
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
      data.courseId,
      user.id
    );
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Must be enrolled in course to leave feedback", "INSUFFICIENT_ROLE");
    }
  }

  return feedbackRepo.upsertCourseFeedback({
    courseId: data.courseId,
    userId: user.id,
    rating: Number(data.rating),
    comment: data.comment || null,
  });
};

const getCourseFeedback = async (courseId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  return feedbackRepo.findCourseFeedback(courseId);
};

const createTrainerFeedback = async (data, user) => {
  if (user.role !== "TRAINEE") {
    throw new ApiError(403, "Only trainees can rate trainers", "INSUFFICIENT_ROLE");
  }

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
    data.courseId,
    user.id
  );
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new ApiError(403, "Must be enrolled in course to rate trainer", "INSUFFICIENT_ROLE");
  }

  return feedbackRepo.upsertTrainerFeedback({
    courseId: data.courseId,
    trainerId: data.trainerId,
    traineeId: user.id,
    rating: Number(data.rating),
    comment: data.comment || null,
  });
};

const getTrainerCourseFeedback = async (courseId, trainerId) => {
  return feedbackRepo.findTrainerCourseFeedback(courseId, trainerId);
};

const createResourceFeedback = async (resourceId, data, user) => {
  return feedbackRepo.upsertResourceFeedback({
    resourceId,
    userId: user.id,
    rating: Number(data.rating),
    comment: data.comment || null,
  });
};

const getResourceFeedback = async (resourceId) => {
  return feedbackRepo.findResourceFeedback(resourceId);
};

const createAssessmentComment = async (assessmentId, data, user) => {
  return feedbackRepo.createAssessmentComment({
    assessmentId,
    userId: user.id,
    comment: data.comment,
    isGrievance: Boolean(data.isGrievance),
  });
};

const getAssessmentComments = async (assessmentId) => {
  return feedbackRepo.findAssessmentComments(assessmentId);
};

module.exports = {
  createCourseFeedback,
  getCourseFeedback,
  createTrainerFeedback,
  getTrainerCourseFeedback,
  createResourceFeedback,
  getResourceFeedback,
  createAssessmentComment,
  getAssessmentComments,
};
