const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/env");
const { ApiError } = require("../../utils/ApiError");
const authRepo = require("./auth.repository");
const notificationsService = require("../notifications/notifications.service");

const JWT_EXPIRY = "7d";

const generateToken = (userId) => {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: JWT_EXPIRY });
};

const register = async (email, password, role = "TRAINEE", name) => {
  const existingUser = await authRepo.findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, "Email already in use", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await authRepo.createUser({
    email,
    name,
    passwordHash,
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

  return user;
};

const login = async (email, password) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.status !== "APPROVED") {
    throw new ApiError(403, "Account not approved yet", "ACCOUNT_NOT_APPROVED");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = generateToken(user.id);
  return { token, user };
};

const getMe = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }
  return user;
};

module.exports = {
  register,
  login,
  getMe,
};
