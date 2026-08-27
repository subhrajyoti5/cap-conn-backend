const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2Client } = require("../../config/r2");
const { openaiApiKey, openaiBaseUrl, openaiModel, r2Bucket } = require("../../config/env");
const { ApiError } = require("../../utils/ApiError");
const { DOWNLOAD_TTL_SECONDS } = require("../resources/resources.constants");

const OVERGENERATE = 5;
let OpenAI;

const getClient = () => {
  if (!OpenAI) {
    try {
      OpenAI = require("openai");
    } catch (err) {
      throw new ApiError(
        503,
        "openai package is not installed yet",
        "SERVICE_UNAVAILABLE"
      );
    }
  }
  if (!openaiApiKey || openaiApiKey.includes("YOUR_OPENAI_KEY_HERE") || openaiApiKey.includes("YOUR_OPENROUTER_KEY_HERE")) {
    throw new ApiError(
      503,
      "OPENAI_API_KEY is not configured in .env",
      "SERVICE_UNAVAILABLE"
    );
  }
  const options = { apiKey: openaiApiKey };
  if (openaiBaseUrl) {
    options.baseURL = openaiBaseUrl;
    options.defaultHeaders = {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Capacity Connect LMS",
    };
  }
  return new OpenAI(options);
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

const SYSTEM_PROMPT = `You are an expert assessment writer. Generate multiple-choice questions from the provided instructions, topics, theory text, and/or course images.
Rules:
- Return ONLY valid JSON matching the schema.
- Each question must have exactly 4 options and exactly one correct option (isCorrect: true).
- Questions must be clear, educational, and strictly relevant to the subject matter.
- Include a short explanation for each question.
- Do not wrap the JSON in markdown fences.`;

const buildUserText = ({ questionCount, customInstructions, theoryText, marks, hasImages }) => {
  const total = questionCount + OVERGENERATE;
  const sections = [
    `Generate exactly ${total} MCQ questions (requested ${questionCount} + ${OVERGENERATE} extras for curation).`,
    `Default marks per question: ${marks}.`,
  ];

  if (theoryText?.trim()) {
    sections.push(`Reference Material / Theory Text:\n${theoryText.trim()}`);
  }

  if (customInstructions?.trim()) {
    sections.push(`Topic / Trainer Instructions:\n${customInstructions.trim()}`);
  } else if (!hasImages && !theoryText?.trim()) {
    sections.push(`Topic / Trainer Instructions:\nGeneral knowledge questions appropriate for this course level.`);
  }

  sections.push(
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
    })
  );

  return sections.join("\n");
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
 * Generate N+5 candidate MCQs from prompt, theory text, and/or image resources.
 */
const generateMcqFromImages = async ({
  resources = [],
  questionCount,
  customInstructions,
  theoryText,
  marksPerQuestion = 1,
}) => {
  const client = getClient();
  const marks = Math.max(1, Math.floor(Number(marksPerQuestion) || 1));
  const count = Math.max(1, Math.min(20, Math.floor(Number(questionCount) || 1)));

  const imageUrls = [];
  if (Array.isArray(resources) && resources.length > 0) {
    for (const resource of resources) {
      if (resource) {
        const url = await resolveImageUrl(resource);
        imageUrls.push(url);
      }
    }
  }

  const userText = buildUserText({
    questionCount: count,
    customInstructions,
    theoryText,
    marks,
    hasImages: imageUrls.length > 0,
  });

  let content;
  if (imageUrls.length > 0) {
    content = [
      { type: "text", text: userText },
      ...imageUrls.map((url) => ({
        type: "image_url",
        image_url: { url, detail: "high" },
      })),
    ];
  } else {
    content = userText;
  }

  let completion;
  const isOpenRouter = typeof openaiBaseUrl === "string" && openaiBaseUrl.includes("openrouter");
  const targetModel = (openaiModel || (isOpenRouter ? "openrouter/auto" : "gpt-4o-mini"))
    .replace(/[–—]/g, "-")
    .trim();

  const candidateModels = isOpenRouter
    ? [
        targetModel,
        "openrouter/auto",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "deepseek/deepseek-r1:free",
        "qwen/qwen-2.5-coder-32b-instruct:free",
      ].filter((v, i, a) => v && a.indexOf(v) === i)
    : [targetModel, "gpt-4o-mini", "gpt-4o"].filter((v, i, a) => v && a.indexOf(v) === i);

  let lastError;
  for (const modelCandidate of candidateModels) {
    try {
      const params = {
        model: modelCandidate,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      };
      if (!openaiBaseUrl) {
        params.response_format = { type: "json_object" };
      }
      completion = await client.chat.completions.create(params);
      if (completion?.choices?.[0]?.message) {
        break;
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!completion) {
    throw new ApiError(
      502,
      lastError?.message || "AI generation failed across available models",
      "AI_GENERATION_FAILED"
    );
  }

  const rawText =
    completion.choices?.[0]?.message?.content ||
    completion.choices?.[0]?.message?.reasoning ||
    "";
  if (!rawText || !rawText.trim()) {
    throw new ApiError(502, "Empty AI response from provider", "AI_INVALID_RESPONSE");
  }

  let parsed;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
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
