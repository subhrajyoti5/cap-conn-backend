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

    if (resource.trainerId !== req.user.id) {
      throw new ApiError(403, "Not the resource owner", "NOT_OWNER");
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
