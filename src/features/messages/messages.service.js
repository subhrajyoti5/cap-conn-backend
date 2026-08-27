const { ApiError } = require("../../utils/ApiError");
const messagesRepo = require("./messages.repository");
const { prisma } = require("../../database/prisma");

const getConversations = async (user) => {
  return messagesRepo.findConversations(user.id);
};

const getThread = async (user, partnerId) => {
  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!partner) throw new ApiError(404, "User not found", "NOT_FOUND");

  await messagesRepo.markThreadRead(user.id, partnerId);
  const messages = await messagesRepo.findThread(user.id, partnerId);
  return { partner, messages };
};

const sendMessage = async (user, { receiverId, content }) => {
  if (user.id === receiverId) {
    throw new ApiError(400, "Cannot send direct message to yourself", "INVALID_INPUT");
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new ApiError(404, "Recipient not found", "NOT_FOUND");

  return messagesRepo.createMessage({
    senderId: user.id,
    receiverId,
    content,
  });
};

const markRead = async (user, partnerId) => {
  return messagesRepo.markThreadRead(user.id, partnerId);
};

const getDirectory = async (user) => {
  return messagesRepo.getDirectoryContacts(user);
};

module.exports = {
  getConversations,
  getThread,
  sendMessage,
  markRead,
  getDirectory,
};
