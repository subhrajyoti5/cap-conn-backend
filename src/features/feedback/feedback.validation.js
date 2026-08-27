const z = require("zod");

const courseFeedbackSchema = z.object({
  body: z.object({
    courseId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

const trainerFeedbackSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

const resourceFeedbackSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

const assessmentCommentSchema = z.object({
  body: z.object({
    comment: z.string().min(1).max(1000),
    isGrievance: z.boolean().optional(),
  }),
});

module.exports = {
  courseFeedbackSchema,
  trainerFeedbackSchema,
  resourceFeedbackSchema,
  assessmentCommentSchema,
};
