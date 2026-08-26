const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const { defaultLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");
const { captureRawBody } = require("./middleware/rawBody");
const authRoutes = require("./features/auth/auth.routes");
const usersRoutes = require("./features/users/users.routes");
const profilesRoutes = require("./features/profiles/profiles.routes");
const certificationsRoutes = require("./features/certifications/certifications.routes");
const subjectsRoutes = require("./features/subjects/subjects.routes");
const coursesRoutes = require("./features/courses/courses.routes");
const enrollmentsRoutes = require("./features/enrollments/enrollments.routes");
const resourcesRoutes = require("./features/resources/resources.routes");
const assessmentsRoutes = require("./features/assessments/assessments.routes");
const dashboardRoutes = require("./features/dashboard/dashboard.routes");
const notificationsRoutes = require("./features/notifications/notifications.routes");
const announcementsRoutes = require("./features/announcements/announcements.routes");
const achievementsRoutes = require("./features/achievements/achievements.routes");
const feedbackRoutes = require("./features/feedback/feedback.routes");
const competenciesRoutes = require("./features/competencies/competencies.routes");

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://capconn.subhr.in",
  "https://cap-conn-frontend-red.vercel.app",
  env.corsOrigin,
];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Webhook route needs raw body before JSON parser
app.use("/api/webhooks", express.raw({ type: "application/json" }), captureRawBody);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(defaultLimiter);

app.use("/", authRoutes);
app.use("/", usersRoutes);
app.use("/", profilesRoutes);
app.use("/", certificationsRoutes);
app.use("/", subjectsRoutes);
app.use("/", coursesRoutes);
app.use("/", enrollmentsRoutes);
app.use("/", resourcesRoutes);
app.use("/", assessmentsRoutes);
app.use("/", dashboardRoutes);
app.use("/", notificationsRoutes);
app.use("/", announcementsRoutes);
app.use("/", achievementsRoutes);
app.use("/", feedbackRoutes);
app.use("/", competenciesRoutes);

app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use(errorHandler);

module.exports = app;
