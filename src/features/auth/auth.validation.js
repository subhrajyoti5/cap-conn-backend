const { z } = require("zod");

const webhookSchema = z.object({
  body: z.object({
    type: z.string(),
    data: z.record(z.any()),
  }),
});

module.exports = { webhookSchema };
