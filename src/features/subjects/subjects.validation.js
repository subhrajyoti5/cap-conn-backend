const { z } = require("zod");

const subjectSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional().nullable(),
  }),
});

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = { subjectSchema, idSchema };
