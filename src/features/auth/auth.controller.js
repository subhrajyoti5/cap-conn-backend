const { asyncHandler } = require("../../utils/asyncHandler");
const authService = require("./auth.service");

const handleClerkWebhook = asyncHandler(async (req, res) => {
  const payload = req.rawBody || JSON.stringify(req.body);
  const event = await authService.handleWebhook(req.headers, payload);
  res.status(200).json({ success: true, data: event });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.auth.userId);
  res.json({ success: true, data: user });
});

module.exports = {
  handleClerkWebhook,
  getMe,
};
