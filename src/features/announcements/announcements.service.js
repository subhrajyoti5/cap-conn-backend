const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const { prisma } = require("../../database/prisma");
const announcementsRepo = require("./announcements.repository");

const listAnnouncements = async (query) => {
  return announcementsRepo.findPublished(query);
};

const createAnnouncement = async (data, authorId) => {
  return announcementsRepo.create({ ...data, authorId, status: "DRAFT" });
};

const publishAnnouncement = async (id, actorId) => {
  return prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await createAuditLog(
      actorId,
      "ANNOUNCEMENT_PUBLISHED",
      "ANNOUNCEMENT",
      id,
      null,
      tx
    );
    return announcement;
  });
};

module.exports = {
  listAnnouncements,
  createAnnouncement,
  publishAnnouncement,
};
