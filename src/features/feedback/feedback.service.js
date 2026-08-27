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

const deleteCourseFeedback = async (courseId, user) => {
  return feedbackRepo.deleteCourseFeedback(courseId, user.id);
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

const deleteTrainerFeedback = async (courseId, trainerId, user) => {
  return feedbackRepo.deleteTrainerFeedback(courseId, trainerId, user.id);
};

const getTrainerCourseFeedback = async (courseId, trainerId) => {
  return feedbackRepo.findTrainerCourseFeedback(courseId, trainerId);
};

const createResourceFeedback = async (resourceId, data, user) => {
  return feedbackRepo.createResourceFeedback({
    resourceId,
    userId: user.id,
    rating: Number(data.rating || 5),
    comment: data.comment || null,
  });
};

const updateResourceFeedback = async (commentId, data, user) => {
  return feedbackRepo.updateResourceFeedback(commentId, user.id, data);
};

const deleteResourceFeedback = async (commentId, user) => {
  return feedbackRepo.deleteResourceFeedback(commentId, user.id);
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

const updateAssessmentComment = async (commentId, data, user) => {
  return feedbackRepo.updateAssessmentComment(commentId, user.id, data);
};

const deleteAssessmentComment = async (commentId, user) => {
  return feedbackRepo.deleteAssessmentComment(commentId, user.id);
};

const getAssessmentComments = async (assessmentId) => {
  return feedbackRepo.findAssessmentComments(assessmentId);
};

module.exports = {
  createCourseFeedback,
  deleteCourseFeedback,
  getCourseFeedback,
  createTrainerFeedback,
  deleteTrainerFeedback,
  getTrainerCourseFeedback,
  createResourceFeedback,
  updateResourceFeedback,
  deleteResourceFeedback,
  getResourceFeedback,
  createAssessmentComment,
  updateAssessmentComment,
  deleteAssessmentComment,
  getAssessmentComments,
};
