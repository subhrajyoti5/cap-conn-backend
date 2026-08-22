const { z } = require("zod");

const roleSchema = z.object({
  body: z.object({
    role: z.enum(["TRAINEE", "TRAINER", "ADMIN"]),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

const rejectSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
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

const paramsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = {
  roleSchema,
  rejectSchema,
  listSchema,
  paramsSchema,
};
