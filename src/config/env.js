require("dotenv").config();
// Trigger watcher reload

const required = [
  "PORT",
  "NODE_ENV",
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_WEBHOOK_SECRET",
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

module.exports = {
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  r2Endpoint: process.env.R2_ENDPOINT,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10),
};
