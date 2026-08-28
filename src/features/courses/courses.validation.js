const { z } = require("zod");

const courseSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    subjectId: z.string().uuid(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    subjectId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "COMPLETED", "ARCHIVED", "SUSPENDED"]).optional(),
    isFeatured: z.boolean().optional(),
    featuredOrder: z.number().int().optional(),
  }),
});

const listCoursesSchema = z.object({
  query: z.object({
    subjectId: z.string().uuid().optional(),
    trainerId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "COMPLETED", "ARCHIVED", "SUSPENDED"]).optional(),
    isFeatured: z.preprocess((val) => (val === "true" ? true : val === "false" ? false : val), z.boolean().optional()),
    sort: z.enum(["featured", "newest"]).optional(),
    search: z.string().optional(),
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
  courseSchema,
  updateCourseSchema,
  listCoursesSchema,
  paramsSchema,
};
