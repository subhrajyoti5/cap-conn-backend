const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.get("/dashboard/trainee", requireRole("TRAINEE"), dashboardController.getDashboard);
router.get("/dashboard/trainer", requireRole("TRAINER"), dashboardController.getDashboard);
router.get("/dashboard/admin", requireRole("ADMIN"), dashboardController.getDashboard);

module.exports = router;
