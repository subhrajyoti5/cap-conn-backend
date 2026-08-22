const { asyncHandler } = require("../../utils/asyncHandler");
const dashboardService = require("./dashboard.service");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user);
  res.json({ success: true, data });
});

module.exports = { getDashboard };
