const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const { strictLimiter } = require("../../middleware/rateLimiter");
const resourcesController = require("./resources.controller");
const {
  uploadUrlSchema,
  createResourceSchema,
  paramsSchema,
  courseResourcesSchema,
} = require("./resources.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/resources/upload-url",
  requireRole("TRAINER", "ADMIN"),
  strictLimiter,
  validate(uploadUrlSchema),
  resourcesController.getUploadUrl
);

router
  .route("/resources")
  .post(
    requireRole("TRAINER", "ADMIN"),
    validate(createResourceSchema),
    resourcesController.createResource
  );

router
  .route("/resources/:id")
  .get(validate(paramsSchema), resourcesController.getResource)
  .delete(requireRole("TRAINER", "ADMIN"), validate(paramsSchema), resourcesController.deleteResource);

router.get(
  "/courses/:id/resources",
  validate(courseResourcesSchema),
  resourcesController.listCourseResources
);

module.exports = router;
