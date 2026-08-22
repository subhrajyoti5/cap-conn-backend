const { asyncHandler } = require("../../utils/asyncHandler");
const notificationsService = require("./notifications.service");

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationsService.listMyNotifications(
    req.user.id,
    req.validated.query
  );
  res.json({ success: true, ...result });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationsService.markNotificationRead(
    req.params.id,
    req.user.id
  );
  res.json({ success: true, data: notification });
});

const bulkCreate = asyncHandler(async (req, res) => {
  const result = await notificationsService.bulkCreate(req.body);
  res.status(201).json({ success: true, data: result });
});

module.exports = {
  listNotifications,
  markRead,
  bulkCreate,
};
