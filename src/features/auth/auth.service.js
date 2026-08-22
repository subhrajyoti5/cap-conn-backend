const { Webhook } = require("svix");
const { clerkWebhookSecret } = require("../../config/env");
const { clerkClient } = require("../../config/clerk");
const { ApiError } = require("../../utils/ApiError");
const authRepo = require("./auth.repository");
const notificationsService = require("../notifications/notifications.service");
const { WEBHOOK_EVENTS } = require("./auth.constants");

const verifyWebhook = (headers, payload) => {
  const wh = new Webhook(clerkWebhookSecret);
  return wh.verify(payload, {
    "svix-id": headers["svix-id"],
    "svix-timestamp": headers["svix-timestamp"],
    "svix-signature": headers["svix-signature"],
  });
};

const handleWebhook = async (headers, payload) => {
  const event = verifyWebhook(headers, payload);

  if (event.type === WEBHOOK_EVENTS.USER_CREATED) {
    const {
      id: clerkUserId,
      email_addresses,
      unsafe_metadata,
      public_metadata,
    } = event.data;

    const email = email_addresses?.find((e) => e.id === event.data.primary_email_address_id)?.email_address || email_addresses?.[0]?.email_address;

    if (!email) {
      throw new ApiError(400, "Email address missing", "VALIDATION_ERROR");
    }

    const metadata = { ...unsafe_metadata, ...public_metadata };
    const role = metadata?.role === "ADMIN" ? "ADMIN" : (metadata?.role === "TRAINER" ? "TRAINER" : "TRAINEE");

    const existing = await authRepo.findUserByClerkId(clerkUserId);
    if (existing) return existing;

    const user = await authRepo.createUser({
      clerkUserId,
      email,
      role,
      status: role === "ADMIN" ? "APPROVED" : "PENDING",
    });

    // If the user is not admin, they need approval. Notify admins.
    if (role !== "ADMIN") {
      await notificationsService.bulkCreate({
        role: "ADMIN",
        type: "APPROVAL",
        title: "New user pending approval",
        body: `${email} (${role}) signed up and requires approval.`,
      });
    }

    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: { role, status: role === "ADMIN" ? "APPROVED" : "PENDING" },
    }).catch(() => null);

    return user;
  }

  if (event.type === WEBHOOK_EVENTS.USER_DELETED) {
    const { id: clerkUserId } = event.data;
    return authRepo.deleteUserByClerkId(clerkUserId).catch(() => null);
  }

  return null;
};

const getMe = async (clerkUserId) => {
  return authRepo.findUserByClerkId(clerkUserId);
};

module.exports = {
  handleWebhook,
  getMe,
};
