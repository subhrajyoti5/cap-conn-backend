const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const subjectsController = require("./subjects.controller");
const { subjectSchema } = require("./subjects.validation");

const router = express.Router();

router.get("/subjects", authenticate, requireUser, requireApprovedUser, subjectsController.listSubjects);
router.post(
  "/admin/subjects",
  authenticate,
  requireUser,
  requireApprovedUser,
  requireRole("ADMIN"),
  validate(subjectSchema),
  subjectsController.createSubject
);

module.exports = router;
