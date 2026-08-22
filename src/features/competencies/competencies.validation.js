const { z } = require("zod");

const competencySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    subjectId: z.string().uuid(),
  }),
});

const listSchema = z.object({
  query: z.object({
    subjectId: z.string().uuid().optional(),
  }),
});

const matchSchema = z.object({
  query: z.object({
    subjectId: z.string().uuid(),
  }),
});

module.exports = { competencySchema, listSchema, matchSchema };
