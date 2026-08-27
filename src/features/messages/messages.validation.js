const z = require("zod");

const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid(),
    content: z.string().min(1).max(5000),
  }),
});

module.exports = {
  sendMessageSchema,
};
