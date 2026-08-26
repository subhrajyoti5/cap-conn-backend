const { z } = require("zod");

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1),
  explanation: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  marks: z.coerce.number().int().positive().default(1),
  order: z.coerce.number().int().nonnegative(),
  options: z.array(optionSchema).min(2),
});

const createAssessmentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    evaluationMode: z.enum(["INSTANT", "MANUAL_RELEASE"]).optional().default("INSTANT"),
    resultsReleased: z.boolean().optional(),
    totalMarks: z.coerce.number().int().positive(),
    startTime: z.coerce.date().optional(),
    deadline: z.coerce.date(),
    questions: z.array(questionSchema).min(1),
  }),
});

const updateAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    evaluationMode: z.enum(["INSTANT", "MANUAL_RELEASE"]).optional(),
    resultsReleased: z.boolean().optional(),
    totalMarks: z.coerce.number().int().positive().optional(),
    startTime: z.coerce.date().optional(),
    deadline: z.coerce.date().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
    questions: z.array(questionSchema).optional(),
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

const generateAiSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    resourceIds: z.array(z.string().uuid()).optional().default([]),
    customInstructions: z.string().max(4000).optional().nullable(),
    theoryText: z.string().max(10000).optional().nullable(),
    questionCount: z.coerce.number().int().min(1).max(20),
    marksPerQuestion: z.coerce.number().int().positive().optional().default(1),
  }),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitSchema,
  paramsSchema,
  listSchema,
  generateAiSchema,
};
