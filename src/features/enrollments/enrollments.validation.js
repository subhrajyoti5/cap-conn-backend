const { z } = require("zod");

const listEnrollmentsSchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "DROPPED", "REJECTED"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

const paramsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const approveParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    traineeId: z.string().uuid(),
  }),
});

module.exports = { listEnrollmentsSchema, paramsSchema, approveParamsSchema };
