const { prisma } = require("../database/prisma");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { clerkClient } = require("../config/clerk");

const requireUser = asyncHandler(async (req, res, next) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    console.log(`User ${clerkUserId} not found in DB. Auto-syncing from Clerk...`);
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
      
      if (!email) {
        throw new ApiError(400, "Email address missing from Clerk account", "VALIDATION_ERROR");
      }

      const metadata = { ...clerkUser.unsafeMetadata, ...clerkUser.publicMetadata };
      
      let role = "TRAINEE";
      if (metadata?.role === "TRAINER") role = "TRAINER";
      if (metadata?.role === "ADMIN") role = "ADMIN";
      
      const status = metadata?.status || "PENDING";

      user = await prisma.user.create({
        data: {
          clerkUserId,
          email,
          role,
          status,
        },
      });
      console.log(`Successfully synced user ${email} to database.`);

      if (!clerkUser.publicMetadata?.role || !clerkUser.publicMetadata?.status) {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: { role, status },
        }).catch(() => null);
      }
    } catch (err) {
      console.error("Failed to auto-sync user from Clerk:", err);
      throw new ApiError(404, "User not found and could not be synced", "USER_NOT_FOUND");
    }
  }

  req.user = user;
  next();
});

module.exports = { requireUser };
