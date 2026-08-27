const { asyncHandler } = require("../../utils/asyncHandler");
const messagesService = require("./messages.service");

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await messagesService.getConversations(req.user);
  res.json({ success: true, data: conversations });
});

const getThread = asyncHandler(async (req, res) => {
  const thread = await messagesService.getThread(req.user, req.params.partnerId);
  res.json({ success: true, data: thread });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await messagesService.sendMessage(req.user, req.body);
  res.status(201).json({ success: true, data: message });
});

const markRead = asyncHandler(async (req, res) => {
  await messagesService.markRead(req.user, req.params.partnerId);
  res.json({ success: true, message: "Thread marked as read" });
});

const getDirectory = asyncHandler(async (req, res) => {
  const directory = await messagesService.getDirectory(req.user);
  res.json({ success: true, data: directory });
});

module.exports = {
  getConversations,
  getThread,
  sendMessage,
  markRead,
  getDirectory,
};
