const OpenAI = require("openai");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2Client } = require("../../config/r2");
const { openaiApiKey, r2Bucket } = require("../../config/env");
const { ApiError } = require("../../utils/ApiError");
const { DOWNLOAD_TTL_SECONDS } = require("../resources/resources.constants");

const OVERGENERATE = 5;

const getClient = () => {
  if (!openaiApiKey) {
    throw new ApiError(
      503,
      "OPENAI_API_KEY is not configured",
      "SERVICE_UNAVAILABLE"
    );
  }
  return new OpenAI({ apiKey: openaiApiKey });
};

const isExternalUrl = (key) =>
  typeof key === "string" &&
  (key.startsWith("http://") || key.startsWith("https://"));

const resolveImageUrl = async (resource) => {
  if (isExternalUrl(resource.storageKey)) {
    return resource.storageKey;
  }
  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: resource.storageKey,
  });
  return getSignedUrl(r2Client, command, { expiresIn: DOWNLOAD_TTL_SECONDS });
};

const SYSTEM_PROMPT = `You are an expert assessment writer. Generate multiple-choice questions from the provided course images and instructions.
Rules:
- Return ONLY valid JSON matching the schema.
- Each question must have exactly 4 options and exactly one correct option (isCorrect: true).
- Questions must be answerable from the image content and/or instructions.
- Include a short explanation for each question.
- Do not wrap the JSON in markdown fences.`;

const buildUserText = ({ questionCount, customInstructions, marks }) => {
  const total = questionCount + OVERGENERATE;
  return [
    `Generate exactly ${total} MCQ questions (requested ${questionCount} + ${OVERGENERATE} extras for curation).`,
    `Default marks per question: ${marks}.`,
    customInstructions?.trim()
      ? `Additional trainer instructions:\n${customInstructions.trim()}`
      : "No extra instructions.",
    "",
    "Respond with JSON of this exact shape:",
    JSON.stringify({
      questions: [
        {
          text: "Question text?",
          options: [
            { text: "Option A", isCorrect: false },
            { text: "Option B", isCorrect: true },
            { text: "Option C", isCorrect: false },
            { text: "Option D", isCorrect: false },
          ],
          marks: 1,
          explanation: "Why B is correct",
        },
      ],
    }),
  ].join("\n");
};

const normalizeQuestions = (raw, marks) => {
  if (!raw || !Array.isArray(raw.questions)) {
    throw new ApiError(
      502,
      "AI returned invalid question payload",
      "AI_INVALID_RESPONSE"
    );
  }

  return raw.questions.map((q, index) => {
    const options = Array.isArray(q.options) ? q.options : [];
    if (options.length < 2) {
      throw new ApiError(
        502,
        `AI question ${index + 1} has fewer than 2 options`,
        "AI_INVALID_RESPONSE"
      );
    }

    let normalized = options.map((o) => ({
      text: String(o.text || "").trim(),
      isCorrect: Boolean(o.isCorrect),
    }));

    if (!normalized.every((o) => o.text)) {
      throw new ApiError(
        502,
        `AI question ${index + 1} has empty option text`,
        "AI_INVALID_RESPONSE"
      );
    }

    const correctCount = normalized.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      normalized = normalized.map((o, i) => ({
        ...o,
        isCorrect: i === 0,
      }));
    }

    return {
      text: String(q.text || "").trim() || `Question ${index + 1}`,
      options: normalized,
      marks: Number.isFinite(Number(q.marks)) && Number(q.marks) > 0
        ? Math.floor(Number(q.marks))
        : marks,
      explanation: q.explanation ? String(q.explanation) : "",
      order: index,
    };
  });
};

/**
 * Generate N+5 candidate MCQs from course image resources via gpt-4o-mini.
 */
const generateMcqFromImages = async ({
  resources,
  questionCount,
  customInstructions,
  marksPerQuestion = 1,
}) => {
  const client = getClient();
  const marks = Math.max(1, Math.floor(Number(marksPerQuestion) || 1));
  const count = Math.max(1, Math.min(20, Math.floor(Number(questionCount) || 1)));

  const imageUrls = [];
  for (const resource of resources) {
    const url = await resolveImageUrl(resource);
    imageUrls.push(url);
  }

  if (imageUrls.length === 0) {
    throw new ApiError(
      400,
      "At least one image resource is required",
      "VALIDATION_ERROR"
    );
  }

  const content = [
    { type: "text", text: buildUserText({ questionCount: count, customInstructions, marks }) },
    ...imageUrls.map((url) => ({
      type: "image_url",
      image_url: { url, detail: "high" },
    })),
  ];

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    });
  } catch (err) {
    throw new ApiError(
      502,
      err?.message || "OpenAI generation failed",
      "AI_GENERATION_FAILED"
    );
  }

  const rawText = completion.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new ApiError(502, "Empty AI response", "AI_INVALID_RESPONSE");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new ApiError(502, "AI response was not valid JSON", "AI_INVALID_RESPONSE");
  }

  const questions = normalizeQuestions(parsed, marks);
  return {
    candidateQuestions: questions,
    requestedCount: count,
    generatedCount: questions.length,
  };
};

module.exports = {
  generateMcqFromImages,
  OVERGENERATE,
};
