const { ApiError } = require("../../utils/ApiError");
const { prisma } = require("../../database/prisma");
const notificationsRepo = require("./notifications.repository");

const listMyNotifications = async (userId, query) => {
  return notificationsRepo.findNotificationsByUser(userId, query);
};

const markNotificationRead = async (id, userId) => {
  const notification = await notificationsRepo.findNotificationById(id);
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, "Notification not found", "NOT_FOUND");
  }
  return notificationsRepo.markAsRead(id);
};

const bulkCreate = async (data) => {
  let userIds = data.userIds || [];

  if (data.role) {
    const users = await prisma.user.findMany({
      where: { role: data.role, status: "APPROVED" },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  if (userIds.length === 0) {
    return null; // no recipients, skip silently
  }

  const notifications = userIds.map((userId) => ({
    userId,
    type: data.type,
    title: data.title,
    body: data.body,
  }));

  return notificationsRepo.createManyNotifications(notifications);
};

module.exports = {
  listMyNotifications,
  markNotificationRead,
  bulkCreate,
};
