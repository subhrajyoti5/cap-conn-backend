const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const achievementsController = require("./achievements.controller");
const { achievementSchema, listSchema } = require("./achievements.validation");

const router = express.Router();

router.get("/achievements", validate(listSchema), achievementsController.listAchievements);

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/admin/achievements",
  requireRole("ADMIN"),
  validate(achievementSchema),
  achievementsController.createAchievement
);

module.exports = router;
