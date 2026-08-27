require("dotenv").config();
// Trigger watcher reload with gemini-2.0-flash-lite free model

const required = [
  "PORT",
  "NODE_ENV",
  "DATABASE_URL",
  "JWT_SECRET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "CORS_ORIGIN",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",
];

for (const key of required) {
  if (process.env[key] === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim() || null;
const openaiBaseUrl = (process.env.OPENAI_BASE_URL || "").trim() || null;
const openaiModel = (process.env.OPENAI_MODEL || "").trim() || "gpt-4o-mini";

module.exports = {
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  r2Endpoint: process.env.R2_ENDPOINT,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10),
  adminEmail,
  adminPassword,
  openaiApiKey,
  openaiBaseUrl,
  openaiModel,
};
