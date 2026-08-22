const { prisma } = require("../../database/prisma");
const { clerkClient } = require("../../config/clerk");
const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const { logger } = require("../../utils/logger");
const notificationsRepo = require("../notifications/notifications.repository");
const usersRepo = require("./users.repository");
const { USER_ACTIONS } = require("./users.constants");

const syncClerkMetadata = async (clerkUserId, metadata) => {
  try {
    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: metadata,
    });
  } catch (err) {
    logger.error({ err, clerkUserId }, "Failed to sync Clerk metadata");
  }
};

const getPendingUsers = async (query) => {
  return usersRepo.findPendingUsers(query);
};

const approveUser = async (id, actorId) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await usersRepo.updateUserStatus(id, "APPROVED", tx);
    await notificationsRepo.createNotification(
      {
        userId: id,
        type: "APPROVAL",
        title: "Account Approved",
        body: "Your account has been approved by an admin.",
      },
      tx
    );
    await createAuditLog(actorId, USER_ACTIONS.APPROVE, "USER", id, null, tx);
    return u;
  });

  await syncClerkMetadata(user.clerkUserId, { role: user.role, status: "APPROVED" });
  return updated;
};

const rejectUser = async (id, reason, actorId) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await usersRepo.updateUserStatus(id, "REJECTED", tx);
    await createAuditLog(actorId, USER_ACTIONS.REJECT, "USER", id, { reason }, tx);
    return u;
  });

  await syncClerkMetadata(user.clerkUserId, { role: user.role, status: "REJECTED" });
  return updated;
};

const suspendUser = async (id, actorId) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await usersRepo.updateUserStatus(id, "SUSPENDED", tx);
    await createAuditLog(actorId, USER_ACTIONS.SUSPEND, "USER", id, null, tx);
    return updated;
  });
};

const changeUserRole = async (id, role, actorId) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await usersRepo.updateUserRole(id, role, tx);
    await createAuditLog(
      actorId,
      USER_ACTIONS.ROLE_CHANGE,
      "USER",
      id,
      { previousRole: user.role, newRole: role },
      tx
    );
    return updated;
  });
};

const getUserById = async (id, requester) => {
  if (requester.role !== "ADMIN" && requester.id !== id) {
    throw new ApiError(403, "Not allowed", "INSUFFICIENT_ROLE");
  }
  const user = await usersRepo.findUserById(id);
  if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");
  return user;
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  suspendUser,
  changeUserRole,
  getUserById,
};
