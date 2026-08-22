const { prisma } = require("../../database/prisma");
const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const coursesRepo = require("./courses.repository");

const listCourses = async (filters, user) => {
  const result = await coursesRepo.findCourses(filters);

  if (user.role === "TRAINEE") {
    const enrolledCourseIds = new Set(
      (await prisma.enrollment.findMany({
        where: { traineeId: user.id, status: { not: "DROPPED" } },
        select: { courseId: true },
      })).map((e) => e.courseId)
    );

    result.data = result.data.filter((course) => {
      if (["PUBLISHED", "ACTIVE"].includes(course.status)) return true;
      if (enrolledCourseIds.has(course.id)) return true;
      return false;
    });
  }

  return result;
};

const getCourse = async (id) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  return course;
};

const createCourse = async (data, trainerId) => {
  return coursesRepo.create({ ...data, trainerId, status: "DRAFT" });
};

const updateCourse = async (id, data) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  return coursesRepo.update(id, data);
};

const deleteCourse = async (id) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const enrollmentCount = await coursesRepo.countEnrollments(id);
  if (enrollmentCount > 0) {
    throw new ApiError(409, "Cannot delete course with enrollments", "CONFLICT");
  }

  await coursesRepo.remove(id);
  return { deleted: true };
};

const publishCourse = async (id, actorId) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.course.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
    await createAuditLog(actorId, "COURSE_PUBLISHED", "COURSE", id, null, tx);
    return updated;
  });
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
};
