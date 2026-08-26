const { prisma } = require("../../database/prisma");

const getTraineeDashboard = async (traineeId) => {
  const [activeCourses, completedAssessments, recentResults, certifications, activeEnrollments] =
    await Promise.all([
      prisma.enrollment.count({
        where: { traineeId, status: "ACTIVE" },
      }),
      prisma.submission.count({
        where: { traineeId, status: "GRADED" },
      }),
      prisma.submission.findMany({
        where: { traineeId, status: "GRADED" },
        include: { assessment: true },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      prisma.certification.findMany({
        where: { userId: traineeId },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
      prisma.enrollment.findMany({
        where: { traineeId, status: "ACTIVE" },
        select: { courseId: true },
      }),
    ]);

  const courseIds = activeEnrollments.map((e) => e.courseId);
  const totalPublishedAssessments = await prisma.assessment.count({
    where: {
      courseId: { in: courseIds },
      status: "PUBLISHED",
      deadline: { gte: new Date() },
      submissions: {
        none: {
          traineeId,
          status: { in: ["SUBMITTED", "GRADED"] },
        },
      },
    },
  });

  return {
    activeCourses,
    pendingAssessments: totalPublishedAssessments,
    completedAssessments,
    recentResults,
    certifications,
  };
};

const getTrainerDashboard = async (trainerId) => {
  const [courses, totalTrainees, enrollmentStats, pendingToGrade, avgScore, recentFeedback] =
    await Promise.all([
      prisma.course.count({ where: { trainerId } }),
      prisma.enrollment.count({
        where: { course: { trainerId }, status: "ACTIVE" },
      }),
      prisma.enrollment.groupBy({
        by: ["status"],
        where: { course: { trainerId } },
        _count: { status: true },
      }),
      prisma.submission.count({
        where: { status: "SUBMITTED", assessment: { trainerId } },
      }),
      prisma.submission.aggregate({
        where: { status: "GRADED", assessment: { trainerId } },
        _avg: { score: true },
      }),
      prisma.feedback.findMany({
        where: { course: { trainerId } },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    courses,
    totalTrainees,
    enrollmentStats,
    pendingToGrade,
    avgScore: avgScore._avg.score || 0,
    recentFeedback,
  };
};

const getAdminDashboard = async () => {
  const [
    totalUsers,
    pendingApprovals,
    trainees,
    trainers,
    courses,
    activeEnrollments,
    publishedAssessments,
    certifications,
    recentPendingUsers,
    recentCourses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "TRAINEE" } }),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.assessment.count({ where: { status: "PUBLISHED" } }),
    prisma.certification.count(),
    prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.course.findMany({
      include: {
        trainer: { select: { name: true } },
        subject: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalUsers,
    pendingApprovals,
    trainees,
    trainers,
    courses,
    activeEnrollments,
    publishedAssessments,
    certifications,
    recentPendingUsers,
    recentCourses,
  };
};

module.exports = {
  getTraineeDashboard,
  getTrainerDashboard,
  getAdminDashboard,
};
