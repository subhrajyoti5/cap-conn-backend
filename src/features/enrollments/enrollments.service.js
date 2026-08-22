const { ApiError } = require("../../utils/ApiError");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("./enrollments.repository");

const enrollInCourse = async (courseId, traineeId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (!["PUBLISHED", "ACTIVE"].includes(course.status)) {
    throw new ApiError(409, "Course is not open for enrollment", "CONFLICT");
  }

  try {
    const enrollment = await enrollmentsRepo.create({
      courseId,
      traineeId,
      status: "ACTIVE",
    });
    return enrollment;
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "Already enrolled", "ALREADY_ENROLLED");
    }
    throw err;
  }
};

const dropCourse = async (courseId, traineeId) => {
  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, traineeId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found", "NOT_FOUND");
  return enrollmentsRepo.updateStatus(courseId, traineeId, "DROPPED");
};

const listMyEnrollments = async (traineeId, query) => {
  return enrollmentsRepo.findByTrainee(traineeId, query);
};

module.exports = {
  enrollInCourse,
  dropCourse,
  listMyEnrollments,
};
