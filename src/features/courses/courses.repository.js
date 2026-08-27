const { prisma } = require("../../database/prisma");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2Client } = require("../../config/r2");
const { r2Bucket, r2PublicBaseUrl } = require("../../config/env");

const signResourceUrl = async (resource) => {
  if (!resource || !resource.storageKey) return resource;
  if (resource.storageKey.startsWith("http://") || resource.storageKey.startsWith("https://")) {
    return { ...resource, downloadUrl: resource.storageKey };
  }
  try {
    const command = new GetObjectCommand({
      Bucket: r2Bucket,
      Key: resource.storageKey,
    });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return { ...resource, downloadUrl: signedUrl };
  } catch (err) {
    console.error("Failed to sign URL for resource:", resource.id, err);
    const fallbackUrl = r2PublicBaseUrl ? `${r2PublicBaseUrl}/${resource.storageKey}` : resource.storageKey;
    return { ...resource, downloadUrl: fallbackUrl };
  }
};

const findById = async (id, userId = null) => {
  let course;
  try {
    course = await prisma.course.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, name: true, email: true, role: true } },
        subject: true,
        resources: true,
        assessments: {
          include: {
            questions: {
              include: { options: true },
            },
            submissions: {
              include: {
                trainee: { select: { id: true, name: true, email: true } },
              },
            },
          },
          submissions: {
            include: {
              trainee: {
                select: {
                  id: true,
                  email: true,
                  traineeProfile: { select: { fullName: true } },
                },
              },
            },
          },
          _count: {
            select: { submissions: true },
          },
        },
        enrollments: {
          include: {
            trainee: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        feedbacks: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        trainers: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
          },
        },
        invitations: true,
      },
    });
  } catch (err) {
    console.error("Prisma error querying course by id, retrying without nested submissions:", err);
    course = await prisma.course.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, name: true, email: true, role: true } },
        subject: true,
        resources: true,
        assessments: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        enrollments: {
          include: {
            trainee: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        feedbacks: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        trainers: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
          },
        },
        invitations: true,
      },
    });
  }

  if (!course) return null;

  if (course.resources && course.resources.length > 0) {
    try {
      course.resources = await Promise.all(
        course.resources.map(async (r) => {
          try {
            return await signResourceUrl(r);
          } catch (e) {
            console.error("Error signing individual resource:", r.id, e);
            return r;
          }
        })
      );
    } catch (err) {
      console.error("Failed to sign resources array:", err);
    }
  }

  // Map trainee submission for easy frontend access if user is trainee
  if (course.assessments && course.assessments.length > 0) {
    course.assessments = course.assessments.map((a) => {
      let mySub = null;
      if (userId && a.submissions && Array.isArray(a.submissions)) {
        mySub = a.submissions.find((s) => s.traineeId === userId) || null;
      }
      return {
        ...a,
        submission: mySub || (Array.isArray(a.submissions) ? a.submissions[0] : null) || null,
      };
    });
  }

  return course;
};

const findCourses = async ({ subjectId, trainerId, status, search, page, limit }) => {
  const where = {};
  if (subjectId) where.subjectId = subjectId;
  if (trainerId) where.trainerId = trainerId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { 
        trainer: true, 
        subject: true, 
        trainers: true,
        enrollments: {
          include: {
            trainee: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return { data, meta: { page, limit, total } };
};

const create = async (data) => {
  return prisma.course.create({ data });
};

const update = async (id, data) => {
  return prisma.course.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.course.delete({ where: { id } });
};

const countEnrollments = async (courseId) => {
  return prisma.enrollment.count({ where: { courseId, status: { not: "DROPPED" } } });
};

module.exports = {
  findById,
  findCourses,
  create,
  update,
  remove,
  countEnrollments,
};
