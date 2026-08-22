const { z } = require("zod");

const listNotificationsSchema = z.object({
  query: z.object({
    unread: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

const paramsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const bulkCreateSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).optional(),
    role: z.enum(["TRAINEE", "TRAINER", "ADMIN"]).optional(),
    title: z.string().min(1),
    body: z.string().min(1),
    type: z.enum(["APPROVAL", "ASSESSMENT", "ANNOUNCEMENT", "COURSE", "SYSTEM"]),
  }),
});

module.exports = {
  listNotificationsSchema,
  paramsSchema,
  bulkCreateSchema,
};
