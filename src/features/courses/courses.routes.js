const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { requireOwnership, loadCourse } = require("../../middleware/requireOwnership");
const { validate } = require("../../middleware/validate");
const coursesController = require("./courses.controller");
const {
  courseSchema,
  updateCourseSchema,
  listCoursesSchema,
  paramsSchema,
} = require("./courses.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.get("/courses", validate(listCoursesSchema), coursesController.listCourses);
router.post(
  "/courses",
  requireRole("TRAINER", "ADMIN"),
  validate(courseSchema),
  coursesController.createCourse
);

router
  .route("/courses/:id")
  .get(validate(paramsSchema), coursesController.getCourse)
  .patch(
    requireRole("TRAINER", "ADMIN"),
    validate(updateCourseSchema),
    requireOwnership(loadCourse),
    coursesController.updateCourse
  )
  .delete(
    requireRole("TRAINER", "ADMIN"),
    validate(paramsSchema),
    requireOwnership(loadCourse),
    coursesController.deleteCourse
  );

router.patch(
  "/courses/:id/publish",
  requireRole("TRAINER", "ADMIN"),
  validate(paramsSchema),
  requireOwnership(loadCourse),
  coursesController.publishCourse
);

module.exports = router;
