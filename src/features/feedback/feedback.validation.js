const { z } = require("zod");

const feedbackSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional().nullable(),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { feedbackSchema, listSchema };
