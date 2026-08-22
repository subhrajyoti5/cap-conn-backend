const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const competenciesController = require("./competencies.controller");
const { competencySchema, listSchema, matchSchema } = require("./competencies.validation");

const router = express.Router();

router.get(
  "/competencies",
  authenticate,
  requireUser,
  requireApprovedUser,
  validate(listSchema),
  competenciesController.listCompetencies
);

router.get(
  "/trainers/match",
  authenticate,
  requireUser,
  requireApprovedUser,
  requireRole("ADMIN"),
  validate(matchSchema),
  competenciesController.matchTrainers
);

router.post(
  "/admin/competencies",
  authenticate,
  requireUser,
  requireApprovedUser,
  requireRole("ADMIN"),
  validate(competencySchema),
  competenciesController.createCompetency
);

module.exports = router;
