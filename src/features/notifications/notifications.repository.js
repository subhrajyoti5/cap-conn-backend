const { prisma } = require("../../database/prisma");

const createNotification = async (data, tx) => {
  const client = tx || prisma;
  return client.notification.create({ data });
};

const createManyNotifications = async (data, tx) => {
  const client = tx || prisma;
  return client.notification.createMany({ data });
};

const findNotificationsByUser = async (userId, { unread, page, limit }) => {
  const where = { userId };
  if (unread !== undefined) {
    where.isRead = unread === "true" || unread === true;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return { data, meta: { page, limit, total } };
};

const findNotificationById = async (id) => {
  return prisma.notification.findUnique({ where: { id } });
};

const markAsRead = async (id) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

module.exports = {
  createNotification,
  createManyNotifications,
  findNotificationsByUser,
  findNotificationById,
  markAsRead,
};
