const { clerkSecretKey, clerkPublishableKey } = require("./env");
const { createClerkClient } = require("@clerk/backend");

const clerkClient = createClerkClient({
  secretKey: clerkSecretKey,
  publishableKey: clerkPublishableKey,
});

module.exports = { clerkClient };
