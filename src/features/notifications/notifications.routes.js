const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const notificationsController = require("./notifications.controller");
const {
  listNotificationsSchema,
  paramsSchema,
  bulkCreateSchema,
  createNotificationSchema,
} = require("./notifications.validation");

const router = express.Router();

router.use(authenticate, requireUser);

router.get(
  "/notifications",
  requireApprovedUser,
  validate(listNotificationsSchema),
  notificationsController.listNotifications
);

router.post(
  "/notifications",
  requireApprovedUser,
  validate(createNotificationSchema),
  notificationsController.createNotification
);

router.patch(
  "/notifications/:id/read",
  requireApprovedUser,
  validate(paramsSchema),
  notificationsController.markRead
);

router.post(
  "/admin/notifications",
  requireApprovedUser,
  requireRole("ADMIN"),
  validate(bulkCreateSchema),
  notificationsController.bulkCreate
);

module.exports = router;
