const { prisma } = require("../../database/prisma");

const findTraineeProfile = async (userId) => {
  return prisma.traineeProfile.findUnique({
    where: { userId },
    include: {
      qualifications: true,
      workExperiences: true,
      skills: true,
      interests: true,
    },
  });
};

const findTrainerProfile = async (userId) => {
  return prisma.trainerProfile.findUnique({
    where: { userId },
    include: {
      qualifications: true,
      workExperiences: true,
      skills: true,
      trainerCompetencies: { include: { competency: true } },
    },
  });
};

const upsertTraineeProfile = async (userId, data) => {
  return prisma.traineeProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

const upsertTrainerProfile = async (userId, data) => {
  return prisma.trainerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

const getDelegate = (client, model) => {
  return client[model] || client[model.charAt(0).toLowerCase() + model.slice(1)];
};

const createChild = async (model, data, tx) => {
  const client = tx || prisma;
  return getDelegate(client, model).create({ data });
};

const deleteChild = async (model, id, profileIdField, profileId, tx) => {
  const client = tx || prisma;
  return getDelegate(client, model).deleteMany({
    where: { id, [profileIdField]: profileId },
  });
};

const findChildren = async (model, profileId, profileIdField) => {
  const modelDelegate = getDelegate(prisma, model);
  return modelDelegate.findMany({
    where: { [profileIdField]: profileId },
    orderBy: { id: "desc" },
  });
};

const createTrainerCompetency = async (data, tx) => {
  const client = tx || prisma;
  return client.trainerCompetency.create({ data });
};

const deleteTrainerCompetency = async (id, trainerProfileId, tx) => {
  const client = tx || prisma;
  return client.trainerCompetency.deleteMany({
    where: { id, trainerProfileId },
  });
};

const findTrainerProfilePublic = async (userId) => {
  let profile = await findTrainerProfile(userId);
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "TRAINER") return null;
    profile = {
      id: "temp-profile-id",
      userId: user.id,
      fullName: user.name || "Trainer",
      phone: "",
      bio: "",
      qualifications: [],
      workExperiences: [],
      skills: [],
      trainerCompetencies: [],
    };
  }
  const secondaryCoTrained = await prisma.courseTrainer.findMany({
    where: { trainerId: userId },
    select: { courseId: true },
  });
  const secondaryCourseIds = secondaryCoTrained.map((ct) => ct.courseId);

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { trainerId: userId },
        { id: { in: secondaryCourseIds } },
      ],
      status: "PUBLISHED",
    },
    include: {
      subject: true,
      enrollments: true,
      feedbacks: true,
      trainerFeedbacks: { where: { trainerId: userId } },
    },
  });

  const coursesWithRating = courses.map((c) => {
    const courseRatings = c.feedbacks || [];
    const avgCourseRating =
      courseRatings.length > 0
        ? Number(
            (courseRatings.reduce((acc, f) => acc + f.rating, 0) / courseRatings.length).toFixed(1)
          )
        : 0;

    const directTrainerRatings = c.trainerFeedbacks || [];
    const avgDirectRating =
      directTrainerRatings.length > 0
        ? Number(
            (
              directTrainerRatings.reduce((acc, f) => acc + f.rating, 0) /
              directTrainerRatings.length
            ).toFixed(1)
          )
        : 0;

    return {
      ...c,
      avgRating: avgDirectRating || avgCourseRating,
      totalReviews: directTrainerRatings.length || courseRatings.length,
    };
  });

  // Calculate overall trainer rating
  const allTrainerFeedbacks = await prisma.trainerFeedback.findMany({
    where: { trainerId: userId },
  });
  const overallCount = allTrainerFeedbacks.length;
  const overallRating =
    overallCount > 0
      ? Number(
          (allTrainerFeedbacks.reduce((acc, f) => acc + f.rating, 0) / overallCount).toFixed(1)
        )
      : 0;

  return {
    ...profile,
    courses: coursesWithRating,
    overallRating,
    totalReviewsCount: overallCount,
  };
};

const findTraineeProfilePublic = async (userId) => {
  let profile = await findTraineeProfile(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!profile) {
    if (!user) return null;
    profile = {
      id: "temp-profile-id",
      userId: user.id,
      fullName: user.name || user.email?.split("@")[0] || "Trainee",
      phone: "",
      bio: "",
      qualifications: [],
      workExperiences: [],
      skills: [],
      interests: [],
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: userId, status: "ACTIVE" },
    include: {
      course: {
        include: {
          subject: true,
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  const courses = enrollments.map((e) => e.course).filter(Boolean);

  return {
    ...profile,
    email: user?.email || "",
    fullName: profile.fullName || user?.name || "Trainee",
    courses,
  };
};

module.exports = {
  findTraineeProfile,
  findTrainerProfile,
  upsertTraineeProfile,
  upsertTrainerProfile,
  createChild,
  deleteChild,
  findChildren,
  createTrainerCompetency,
  deleteTrainerCompetency,
  findTrainerProfilePublic,
  findTraineeProfilePublic,
};
