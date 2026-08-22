const { asyncHandler } = require("../../utils/asyncHandler");
const announcementsService = require("./announcements.service");

const listAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementsService.listAnnouncements(req.validated.query);
  res.json({ success: true, ...result });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementsService.createAnnouncement(
    req.body,
    req.user.id
  );
  res.status(201).json({ success: true, data: announcement });
});

const publishAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementsService.publishAnnouncement(
    req.params.id,
    req.user.id
  );
  res.json({ success: true, data: announcement });
});

module.exports = {
  listAnnouncements,
  createAnnouncement,
  publishAnnouncement,
};
