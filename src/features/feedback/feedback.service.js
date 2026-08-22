const { ApiError } = require("../../utils/ApiError");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("../enrollments/enrollments.repository");
const feedbackRepo = require("./feedback.repository");

const createFeedback = async (data, user) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(
    data.courseId,
    user.id
  );
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new ApiError(403, "Must be enrolled to leave feedback", "INSUFFICIENT_ROLE");
  }

  return feedbackRepo.upsert({ ...data, userId: user.id });
};

const listCourseFeedback = async (courseId, user, query) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (user.role === "TRAINER" && course.trainerId !== user.id) {
    throw new ApiError(403, "Not course owner", "NOT_OWNER");
  }
  return feedbackRepo.findByCourse(courseId, query);
};

module.exports = {
  createFeedback,
  listCourseFeedback,
};
