const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");
const { r2Client } = require("../../config/r2");
const { r2Bucket } = require("../../config/env");
const { ApiError } = require("../../utils/ApiError");
const coursesRepo = require("../courses/courses.repository");
const enrollmentsRepo = require("../enrollments/enrollments.repository");
const resourcesRepo = require("./resources.repository");
const { MAX_SIZE_BYTES, UPLOAD_TTL_SECONDS, DOWNLOAD_TTL_SECONDS } = require("./resources.constants");

const generateStorageKey = (courseId, fileName) => {
  return `courses/${courseId}/${randomUUID()}-${fileName}`;
};

const isCourseStaff = async (course, user) => {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TRAINER") return false;
  if (course.trainerId === user.id) return true;
  if (course.trainers && course.trainers.some((ct) => ct.trainerId === user.id || ct.trainer?.id === user.id)) {
    return true;
  }
  return false;
};

const ensureNotSuspended = (course, user) => {
  if (!user || user.role === "ADMIN") return;
  if (course && course.status === "SUSPENDED") {
    throw new ApiError(403, "This course is currently suspended by the platform administrator. Actions are locked.", "COURSE_SUSPENDED");
  }
};

const getUploadUrl = async ({ courseId, fileName, mimeType, sizeBytes }, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (!(await isCourseStaff(course, user))) {
    throw new ApiError(403, "Not course owner or co-trainer", "NOT_OWNER");
  }
  ensureNotSuspended(course, user);

  const type = mimeType.startsWith("video/") ? "LECTURE" : "DOCUMENT";
  const maxSize = MAX_SIZE_BYTES[type] || (500 * 1024 * 1024);
  if (sizeBytes && sizeBytes > maxSize) {
    throw new ApiError(400, `File exceeds max size of ${maxSize} bytes`, "VALIDATION_ERROR");
  }

  const storageKey = generateStorageKey(courseId, fileName);
  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: UPLOAD_TTL_SECONDS,
  });

  return { uploadUrl, storageKey };
};

const createResource = async (data, user) => {
  const course = await coursesRepo.findById(data.courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");
  if (!(await isCourseStaff(course, user))) {
    throw new ApiError(403, "Not course owner or co-trainer", "NOT_OWNER");
  }
  ensureNotSuspended(course, user);

  return resourcesRepo.create(data);
};

const canAccessResource = async (resource, user) => {
  if (user.role === "ADMIN") return true;
  if (resource.course.trainerId === user.id) return true;
  const enrollment = await enrollmentsRepo.findByCourseAndTrainee(resource.courseId, user.id);
  return enrollment && enrollment.status === "ACTIVE";
};

const getResource = async (id, user) => {
  const resource = await resourcesRepo.findById(id);
  if (!resource) throw new ApiError(404, "Resource not found", "NOT_FOUND");

  const hasAccess = await canAccessResource(resource, user);
  if (!hasAccess) {
    throw new ApiError(403, "Not enrolled or owner", "INSUFFICIENT_ROLE");
  }

  if (resource.storageKey.startsWith("http://") || resource.storageKey.startsWith("https://")) {
    return { resource, downloadUrl: resource.storageKey };
  }

  let downloadUrl = "#";
  try {
    const command = new GetObjectCommand({
      Bucket: r2Bucket,
      Key: resource.storageKey,
    });

    downloadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: DOWNLOAD_TTL_SECONDS,
    });
  } catch (err) {
    console.warn("R2 presigned download URL generation failed:", err.message);
  }

  return { resource, downloadUrl };
};

const listCourseResources = async (courseId, user) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found", "NOT_FOUND");

  if (user.role !== "ADMIN" && course.trainerId !== user.id) {
    const enrollment = await enrollmentsRepo.findByCourseAndTrainee(courseId, user.id);
    if (!enrollment || enrollment.status !== "ACTIVE") {
      throw new ApiError(403, "Not enrolled or owner", "INSUFFICIENT_ROLE");
    }
  }

  return resourcesRepo.findByCourse(courseId);
};

const deleteResource = async (id, user) => {
  const resource = await resourcesRepo.findById(id);
  if (!resource) throw new ApiError(404, "Resource not found", "NOT_FOUND");
  if (user.role !== "ADMIN" && resource.course.trainerId !== user.id) {
    throw new ApiError(403, "Not resource owner", "NOT_OWNER");
  }

  // Only attempt R2 deletion for keys that are actually stored in R2
  const isExternalUrl = resource.storageKey.startsWith("http://") || resource.storageKey.startsWith("https://");
  if (!isExternalUrl) {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: r2Bucket,
        Key: resource.storageKey,
      })
    );
  }

  await resourcesRepo.remove(id);
  return { deleted: true };
};

module.exports = {
  getUploadUrl,
  createResource,
  getResource,
  listCourseResources,
  deleteResource,
};
