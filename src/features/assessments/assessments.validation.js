const { z } = require("zod");

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1),
  marks: z.coerce.number().int().positive().default(1),
  order: z.coerce.number().int().nonnegative(),
  options: z.array(optionSchema).min(2),
});

const createAssessmentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    totalMarks: z.coerce.number().int().positive(),
    deadline: z.coerce.date(),
    questions: z.array(questionSchema).min(1),
  }),
});

const updateAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    totalMarks: z.coerce.number().int().positive().optional(),
    deadline: z.coerce.date().optional(),
  }),
});

const submitSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().uuid(),
        selectedOptionId: z.string().uuid(),
      })
    ),
  }),
});

const paramsSchema = z.object({
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

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitSchema,
  paramsSchema,
  listSchema,
};
