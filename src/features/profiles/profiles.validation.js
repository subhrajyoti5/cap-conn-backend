const { z } = require("zod");

const profileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    phone: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
  }),
});

const qualificationSchema = z.object({
  body: z.object({
    degree: z.string().min(1),
    institution: z.string().min(1),
    year: z.coerce.number().int().min(1900).max(2100),
  }),
});

const experienceSchema = z.object({
  body: z.object({
    organization: z.string().min(1),
    role: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
  }),
});

const nameSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const competencySchema = z.object({
  body: z.object({
    competencyId: z.string().uuid(),
  }),
});

module.exports = {
  profileSchema,
  qualificationSchema,
  experienceSchema,
  nameSchema,
  idSchema,
  competencySchema,
};
