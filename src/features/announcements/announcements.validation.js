const { z } = require("zod");

const announcementSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  }),
});

const paramsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { announcementSchema, paramsSchema, listSchema };
