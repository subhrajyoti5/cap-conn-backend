const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const announcementsController = require("./announcements.controller");
const { announcementSchema, paramsSchema, listSchema } = require("./announcements.validation");

const router = express.Router();

router.get(
  "/announcements",
  validate(listSchema),
  announcementsController.listAnnouncements
);

router.use(authenticate, requireUser, requireApprovedUser);

router.post(
  "/admin/announcements",
  requireRole("ADMIN"),
  validate(announcementSchema),
  announcementsController.createAnnouncement
);

router.patch(
  "/admin/announcements/:id/publish",
  requireRole("ADMIN"),
  validate(paramsSchema),
  announcementsController.publishAnnouncement
);

module.exports = router;
