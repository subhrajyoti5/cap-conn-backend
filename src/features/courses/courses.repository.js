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

const findById = async (id) => {
  const course = await prisma.course.findUnique({
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
          trainer: { select: { id: true, name: true, email: true } }
        }
      },
      invitations: true,
    },
  });

  if (course && course.resources) {
    course.resources = await Promise.all(course.resources.map(signResourceUrl));
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
      include: { trainer: true, subject: true, trainers: true },
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
