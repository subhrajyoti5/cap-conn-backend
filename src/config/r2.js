const { S3Client } = require("@aws-sdk/client-s3");
const {
  r2Endpoint,
  r2AccessKeyId,
  r2SecretAccessKey,
} = require("./env");

const r2Client = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

module.exports = { r2Client };
