const { prisma } = require("../../database/prisma");
const { ApiError } = require("../../utils/ApiError");
const { createAuditLog } = require("../../utils/auditLog");
const coursesRepo = require("./courses.repository");
const notificationsService = require("../notifications/notifications.service");

const listCourses = async (filters, user) => {
  const result = await coursesRepo.findCourses(filters);

  if (user.role === "TRAINEE") {
    const enrolledCourseIds = new Set(
      (await prisma.enrollment.findMany({
        where: { traineeId: user.id, status: { not: "DROPPED" } },
        select: { courseId: true },
      })).map((e) => e.courseId)
    );

    result.data = result.data.filter((course) => {
      if (["PUBLISHED", "ACTIVE"].includes(course.status)) return true;
      if (enrolledCourseIds.has(course.id)) return true;
      return false;
    });
  }

  return result;
};

const getCourse = async (id, user) => {
  const course = await coursesRepo.findById(id, user?.id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  return course;
};

const createCourse = async (data, trainerId) => {
  return coursesRepo.create({ ...data, trainerId, status: "DRAFT" });
};

const updateCourse = async (id, data) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const updated = await coursesRepo.update(id, data);

  const secondaries = await prisma.courseTrainer.findMany({
    where: { courseId: id },
    select: { trainerId: true },
  });
  const trainerIds = Array.from(new Set([course.trainerId, ...secondaries.map((s) => s.trainerId)]));

  if (data.status === "SUSPENDED") {
    if (trainerIds.length > 0) {
      await notificationsService.bulkCreate({
        userIds: trainerIds,
        type: "COURSE",
        title: "Course Suspended by Admin",
        body: `Your course "${course.title}" has been suspended by the platform administrator. Please wait for further actions or communication from the admin.`,
      });
    }
  } else {
    const trainees = await prisma.enrollment.findMany({
      where: { courseId: id, status: "ACTIVE" },
      select: { traineeId: true },
    });

    const recipientIds = Array.from(new Set([...trainerIds, ...trainees.map((t) => t.traineeId)]));

    if (recipientIds.length > 0) {
      await notificationsService.bulkCreate({
        userIds: recipientIds,
        type: "COURSE",
        title: "Course Details Updated",
        body: `The details for course "${course.title}" have been updated by the instructor.`,
      });
    }
  }

  return updated;
};

const deleteCourse = async (id, user) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  if (user?.role !== "ADMIN") {
    const enrollmentCount = await coursesRepo.countEnrollments(id);
    if (enrollmentCount > 0) {
      throw new ApiError(409, "Cannot delete course with active enrollments", "CONFLICT");
    }
  }

  await coursesRepo.remove(id);
  return { deleted: true };
};

const publishCourse = async (id, actorId) => {
  const course = await coursesRepo.findById(id);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.course.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
    await createAuditLog(actorId, "COURSE_PUBLISHED", "COURSE", id, null, tx);
    return updated;
  });
};

const inviteTrainer = async (courseId, email, actorId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) {
    throw new ApiError(400, "No registered trainer account found with this email.", "BAD_REQUEST");
  }
  if (invitedUser.role !== "TRAINER") {
    throw new ApiError(400, "The user associated with this email is not a trainer", "BAD_REQUEST");
  }
  if (course.trainerId === invitedUser.id) {
    throw new ApiError(400, "Trainer is already the primary instructor", "BAD_REQUEST");
  }
  const existingSecondary = await prisma.courseTrainer.findUnique({
    where: { courseId_trainerId: { courseId, trainerId: invitedUser.id } },
  });
  if (existingSecondary) {
    throw new ApiError(400, "Trainer is already a secondary instructor in this course", "BAD_REQUEST");
  }

  const invitation = await prisma.courseInvitation.upsert({
    where: { courseId_email: { courseId, email } },
    update: { status: "PENDING" },
    create: { courseId, email, status: "PENDING" },
  });

  if (invitedUser) {
    await notificationsService.bulkCreate({
      userIds: [invitedUser.id],
      type: "COURSE",
      title: "Course Co-Trainer Invitation",
      body: `You have been invited to join the course "${course.title}" as a secondary trainer.`,
    });
  }

  return invitation;
};

const acceptInvitation = async (courseId, userId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "TRAINER") {
    throw new ApiError(403, "Only trainers can accept course invitations", "INSUFFICIENT_ROLE");
  }

  const invitation = await prisma.courseInvitation.findUnique({
    where: { courseId_email: { courseId, email: user.email } },
  });
  if (!invitation || invitation.status !== "PENDING") {
    throw new ApiError(404, "Pending invitation not found", "NOT_FOUND");
  }

  await prisma.$transaction([
    prisma.courseInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.courseTrainer.create({
      data: { courseId, trainerId: user.id, role: "SECONDARY" },
    }),
  ]);

  await notificationsService.bulkCreate({
    userIds: [course.trainerId],
    type: "COURSE",
    title: "Invitation Accepted",
    body: `${user.name || user.email} accepted your invitation to join "${course.title}".`,
  });

  return { success: true };
};

const rejectInvitation = async (courseId, userId) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "TRAINER") {
    throw new ApiError(403, "Only trainers can reject course invitations", "INSUFFICIENT_ROLE");
  }

  const invitation = await prisma.courseInvitation.findUnique({
    where: { courseId_email: { courseId, email: user.email } },
  });
  if (!invitation || invitation.status !== "PENDING") {
    throw new ApiError(404, "Pending invitation not found", "NOT_FOUND");
  }

  await prisma.courseInvitation.update({
    where: { id: invitation.id },
    data: { status: "REJECTED" },
  });

  await notificationsService.bulkCreate({
    userIds: [course.trainerId],
    type: "COURSE",
    title: "Invitation Rejected",
    body: `${user.name || user.email} rejected your invitation to join "${course.title}".`,
  });

  return { success: true };
};

const listPendingInvitations = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "TRAINER") {
    throw new ApiError(403, "Only trainers can list invitations", "INSUFFICIENT_ROLE");
  }
  return prisma.courseInvitation.findMany({
    where: { email: user.email, status: "PENDING" },
    include: {
      course: {
        include: {
          trainer: { select: { id: true, name: true, email: true } },
        }
      }
    }
  });
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  inviteTrainer,
  acceptInvitation,
  rejectInvitation,
  listPendingInvitations,
};
