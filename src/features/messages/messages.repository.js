const { prisma } = require("../../database/prisma");

const findConversations = async (userId) => {
  // Get all direct messages where user is sender or receiver
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by conversation partner
  const conversationsMap = new Map();

  for (const m of messages) {
    const isSender = m.senderId === userId;
    const partner = isSender ? m.receiver : m.sender;

    if (!conversationsMap.has(partner.id)) {
      conversationsMap.set(partner.id, {
        partner,
        lastMessage: m,
        unreadCount: !isSender && !m.isRead ? 1 : 0,
      });
    } else {
      const conv = conversationsMap.get(partner.id);
      if (!isSender && !m.isRead) {
        conv.unreadCount += 1;
      }
    }
  }

  // Ensure default contacts for non-admins and admins
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (currentUser) {
    if (currentUser.role !== "ADMIN") {
      // For Trainees and Trainers: ensure Admin Support is present by default
      const hasAdminConv = Array.from(conversationsMap.values()).some(
        (c) => c.partner?.role === "ADMIN"
      );

      if (!hasAdminConv) {
        const defaultAdmin = await prisma.user.findFirst({
          where: { role: "ADMIN", status: "APPROVED" },
          select: { id: true, name: true, email: true, role: true },
        });

        if (defaultAdmin) {
          conversationsMap.set(defaultAdmin.id, {
            partner: {
              ...defaultAdmin,
              name: defaultAdmin.name || "Organization Admin Support",
            },
            lastMessage: null,
            unreadCount: 0,
          });
        }
      }
    } else if (currentUser.role === "ADMIN") {
      // For Admins: ensure all approved Trainers are present by default instead of an empty list
      const trainers = await prisma.user.findMany({
        where: { role: "TRAINER", status: "APPROVED", id: { not: userId } },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: "asc" },
      });

      trainers.forEach((tr) => {
        if (!conversationsMap.has(tr.id)) {
          conversationsMap.set(tr.id, {
            partner: tr,
            lastMessage: null,
            unreadCount: 0,
          });
        }
      });
    }
  }

  return Array.from(conversationsMap.values());
};

const findThread = async (userId, partnerId) => {
  return prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

const createMessage = async ({ senderId, receiverId, content }) => {
  return prisma.directMessage.create({
    data: { senderId, receiverId, content },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

const markThreadRead = async (userId, partnerId) => {
  return prisma.directMessage.updateMany({
    where: {
      senderId: partnerId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });
};

const getDirectoryContacts = async (user) => {
  const contactsMap = new Map();

  if (user.role === "TRAINEE") {
    // 1. Get courses trainee is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: user.id, status: "ACTIVE" },
      include: {
        course: {
          include: {
            trainer: { select: { id: true, name: true, email: true, role: true } },
            trainers: {
              include: {
                trainer: { select: { id: true, name: true, email: true, role: true } },
              },
            },
          },
        },
      },
    });

    const courseIds = [];
    enrollments.forEach((e) => {
      if (!e.course) return;
      courseIds.push(e.course.id);
      const cTitle = e.course.title;

      // Primary trainer
      if (e.course.trainer && e.course.trainer.id !== user.id) {
        const t = e.course.trainer;
        if (!contactsMap.has(t.id)) {
          contactsMap.set(t.id, { ...t, sharedCourses: [cTitle] });
        } else if (!contactsMap.get(t.id).sharedCourses.includes(cTitle)) {
          contactsMap.get(t.id).sharedCourses.push(cTitle);
        }
      }

      // Secondary co-trainers
      (e.course.trainers || []).forEach((ct) => {
        if (ct.trainer && ct.trainer.id !== user.id) {
          const t = ct.trainer;
          if (!contactsMap.has(t.id)) {
            contactsMap.set(t.id, { ...t, sharedCourses: [cTitle] });
          } else if (!contactsMap.get(t.id).sharedCourses.includes(cTitle)) {
            contactsMap.get(t.id).sharedCourses.push(cTitle);
          }
        }
      });
    });

    // Fellow trainees in shared courses
    if (courseIds.length > 0) {
      const peerEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: { in: courseIds },
          traineeId: { not: user.id },
          status: "ACTIVE",
        },
        include: {
          trainee: { select: { id: true, name: true, email: true, role: true } },
          course: { select: { title: true } },
        },
      });

      peerEnrollments.forEach((pe) => {
        if (!pe.trainee) return;
        const p = pe.trainee;
        const cTitle = pe.course?.title || "Course";
        if (!contactsMap.has(p.id)) {
          contactsMap.set(p.id, { ...p, sharedCourses: [cTitle] });
        } else if (!contactsMap.get(p.id).sharedCourses.includes(cTitle)) {
          contactsMap.get(p.id).sharedCourses.push(cTitle);
        }
      });
    }
  } else if (user.role === "TRAINER") {
    // 1. All courses taught by trainer (main or secondary)
    const [mainCourses, secondaryCTs] = await Promise.all([
      prisma.course.findMany({
        where: { trainerId: user.id },
        select: { id: true, title: true },
      }),
      prisma.courseTrainer.findMany({
        where: { trainerId: user.id },
        include: { course: { select: { id: true, title: true } } },
      }),
    ]);

    const courseMap = new Map();
    mainCourses.forEach((c) => courseMap.set(c.id, c.title));
    secondaryCTs.forEach((ct) => {
      if (ct.course) courseMap.set(ct.course.id, ct.course.title);
    });

    const courseIds = Array.from(courseMap.keys());

    // Trainees in trainer's courses
    if (courseIds.length > 0) {
      const studentEnrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds }, status: "ACTIVE" },
        include: {
          trainee: { select: { id: true, name: true, email: true, role: true } },
          course: { select: { id: true, title: true } },
        },
      });

      studentEnrollments.forEach((se) => {
        if (!se.trainee) return;
        const s = se.trainee;
        const cTitle = se.course?.title || "Course";
        if (!contactsMap.has(s.id)) {
          contactsMap.set(s.id, { ...s, sharedCourses: [cTitle] });
        } else if (!contactsMap.get(s.id).sharedCourses.includes(cTitle)) {
          contactsMap.get(s.id).sharedCourses.push(cTitle);
        }
      });
    }

    // 2. All trainers across the organization
    const allTrainers = await prisma.user.findMany({
      where: { role: "TRAINER", id: { not: user.id }, status: "APPROVED" },
      select: { id: true, name: true, email: true, role: true },
    });

    allTrainers.forEach((t) => {
      if (!contactsMap.has(t.id)) {
        contactsMap.set(t.id, { ...t, sharedCourses: [] });
      }
    });
  } else if (user.role === "ADMIN") {
    // Admins see all users in the organization
    const allUsers = await prisma.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    allUsers.forEach((u) => {
      contactsMap.set(u.id, { ...u, sharedCourses: [] });
    });
  }

  // Ensure Trainee & Trainer users see APPROVED Admins in directory
  if (user.role === "TRAINEE" || user.role === "TRAINER") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", id: { not: user.id }, status: "APPROVED" },
      select: { id: true, name: true, email: true, role: true },
    });

    admins.forEach((admin) => {
      if (!contactsMap.has(admin.id)) {
        contactsMap.set(admin.id, { ...admin, sharedCourses: ["Organization Admin Support"] });
      }
    });
  }

  return Array.from(contactsMap.values());
};

module.exports = {
  findConversations,
  findThread,
  createMessage,
  markThreadRead,
  getDirectoryContacts,
};
