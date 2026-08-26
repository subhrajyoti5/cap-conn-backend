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
    type: z.enum(["MCQ", "DOCUMENT"]).optional().default("MCQ"),
    fileUrl: z.string().optional().nullable(),
    fileName: z.string().optional().nullable(),
    totalMarks: z.coerce.number().int().positive(),
    deadline: z.coerce.date(),
    questions: z.array(questionSchema).optional(),
  }),
});

const updateAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    fileName: z.string().optional().nullable(),
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

const submitDocumentSchema = z.object({
  body: z.object({
    fileUrl: z.string().min(1),
    fileName: z.string().min(1),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

const gradeSubmissionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    submissionId: z.string().uuid(),
  }),
  body: z.object({
    score: z.coerce.number().int().min(0),
    feedback: z.string().max(4000).optional().nullable(),
  }),
});

const uploadUrlSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.coerce.number().int().positive().optional(),
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
    resourceIds: z.array(z.string().uuid()).min(1),
    customInstructions: z.string().max(4000).optional().nullable(),
    questionCount: z.coerce.number().int().min(1).max(20),
    marksPerQuestion: z.coerce.number().int().positive().optional().default(1),
  }),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitSchema,
  submitDocumentSchema,
  gradeSubmissionSchema,
  uploadUrlSchema,
  paramsSchema,
  listSchema,
  generateAiSchema,
};
