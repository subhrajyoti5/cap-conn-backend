const { prisma } = require("../database/prisma");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

const requireOwnership = (resourceLoader) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role === "ADMIN") {
      return next();
    }

    const resource = await resourceLoader(req);

    if (!resource) {
      throw new ApiError(404, "Resource not found", "NOT_FOUND");
    }

    const isOwner = resource.trainerId === req.user.id;
    let isSecondary = false;

    if (!isOwner && req.user.role === "TRAINER") {
      const targetCourseId = resource.courseId || resource.id;
      if (targetCourseId) {
        const secondary = await prisma.courseTrainer.findUnique({
          where: {
            courseId_trainerId: {
              courseId: targetCourseId,
              trainerId: req.user.id,
            }
          }
        });
        isSecondary = !!secondary;
      }
    }

    if (!isOwner && !isSecondary) {
      throw new ApiError(403, "Not the resource owner or co-trainer", "NOT_OWNER");
    }

    req.resource = resource;
    next();
  });
};

const loadCourse = async (req) => {
  return prisma.course.findUnique({
    where: { id: req.params.id || req.params.courseId || req.body.courseId },
  });
};

const loadAssessment = async (req) => {
  return prisma.assessment.findUnique({
    where: { id: req.params.id || req.body.assessmentId },
  });
};

module.exports = { requireOwnership, loadCourse, loadAssessment };
