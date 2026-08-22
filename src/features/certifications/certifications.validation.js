const { z } = require("zod");

const certificationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    issuer: z.string().min(1),
    issueDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional().nullable(),
    credentialUrl: z.string().url().optional().nullable(),
  }),
});

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = { certificationSchema, idSchema };
