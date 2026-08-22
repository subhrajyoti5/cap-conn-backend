const dashboardRepo = require("./dashboard.repository");

const getDashboard = async (user) => {
  if (user.role === "ADMIN") {
    return dashboardRepo.getAdminDashboard();
  }
  if (user.role === "TRAINER") {
    return dashboardRepo.getTrainerDashboard(user.id);
  }
  return dashboardRepo.getTraineeDashboard(user.id);
};

module.exports = { getDashboard };
