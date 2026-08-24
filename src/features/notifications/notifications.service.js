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

const createNotification = async (sender, data) => {
  let userIds = data.userIds || [];

  if (data.toAdmins) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "APPROVED" },
      select: { id: true },
    });
    userIds = admins.map((a) => a.id);
  }

  // Authorize targets:
  if (sender.role === "TRAINEE" && !data.toAdmins) {
    // Trainees can only message trainers of their active enrolled courses.
    const enrolledTrainers = await prisma.enrollment.findMany({
      where: { traineeId: sender.id, status: "ACTIVE" },
      include: { course: true },
    });
    const allowedTrainerIds = enrolledTrainers.map((e) => e.course.trainerId);
    userIds = userIds.filter((id) => allowedTrainerIds.includes(id));
  } else if (sender.role === "TRAINER" && !data.toAdmins) {
    // Trainers can only message trainees enrolled in their courses.
    const enrolledTrainees = await prisma.enrollment.findMany({
      where: { course: { trainerId: sender.id }, status: "ACTIVE" },
      select: { traineeId: true },
    });
    const allowedTraineeIds = enrolledTrainees.map((e) => e.traineeId);
    userIds = userIds.filter((id) => allowedTraineeIds.includes(id));
  }

  if (userIds.length === 0) {
    throw new ApiError(400, "No authorized recipients found for this message", "BAD_REQUEST");
  }

  const notifications = userIds.map((userId) => ({
    userId,
    type: data.type,
    title: data.title,
    body: `${sender.name || sender.email} (${sender.role}): ${data.body}`,
  }));

  return notificationsRepo.createManyNotifications(notifications);
};

module.exports = {
  listMyNotifications,
  markNotificationRead,
  bulkCreate,
  createNotification,
};
