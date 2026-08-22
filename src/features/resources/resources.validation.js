const { z } = require("zod");

const uploadUrlSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.coerce.number().int().positive(),
  }),
});

const createResourceSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    type: z.enum(["LECTURE", "PRESENTATION", "STUDY_MATERIAL", "DOCUMENT", "OTHER"]),
    storageKey: z.string().min(1),
    sizeBytes: z.coerce.number().int().positive(),
    mimeType: z.string().min(1),
  }),
});

const paramsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const courseResourcesSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = {
  uploadUrlSchema,
  createResourceSchema,
  paramsSchema,
  courseResourcesSchema,
};
