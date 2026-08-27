const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { validate } = require("../../middleware/validate");
const messagesController = require("./messages.controller");
const { sendMessageSchema } = require("./messages.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.get("/conversations", messagesController.getConversations);
router.get("/thread/:partnerId", messagesController.getThread);
router.post("/", validate(sendMessageSchema), messagesController.sendMessage);
router.patch("/read/:partnerId", messagesController.markRead);
router.get("/directory", messagesController.getDirectory);

module.exports = router;
