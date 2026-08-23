const { asyncHandler } = require("../../utils/asyncHandler");
const authService = require("./auth.service");
const { ApiError } = require("../../utils/ApiError");

const register = asyncHandler(async (req, res) => {
  const { email, password, role, name } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required", "VALIDATION_ERROR");
  }

  const validRoles = ["TRAINEE", "TRAINER", "ADMIN"];
  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role", "VALIDATION_ERROR");
  }

  const user = await authService.register(email, password, role || "TRAINEE", name);

  res.status(201).json({
    success: true,
    message: user.status === "APPROVED"
      ? "Registration successful."
      : "Registration successful. Please wait for admin approval.",
    data: { id: user.id, email: user.email, role: user.role, status: user.status },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required", "VALIDATION_ERROR");
  }

  const { token, user } = await authService.login(email, password);

  res.json({
    success: true,
    message: "Login successful",
    data: { token, user: { id: user.id, email: user.email, role: user.role, status: user.status } },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.auth.userId);
  res.json({ success: true, data: user });
});

module.exports = {
  register,
  login,
  getMe,
};
