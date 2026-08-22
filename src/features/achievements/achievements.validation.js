const { z } = require("zod");

const achievementSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { achievementSchema, listSchema };
