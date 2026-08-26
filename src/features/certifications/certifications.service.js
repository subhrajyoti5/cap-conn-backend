const { ApiError } = require("../../utils/ApiError");
const certRepo = require("./certifications.repository");
const { prisma } = require("../../database/prisma");

const listMyCertifications = async (userId) => {
  return certRepo.findByUser(userId);
};

const createCertification = async (userId, data) => {
  return certRepo.create({ userId, ...data });
};

const issueCertifications = async (issuerUserId, { traineeIds, name, issuer, credentialUrl, expiryDate, templateData }) => {
  if (!traineeIds || !Array.isArray(traineeIds) || traineeIds.length === 0) {
    throw new ApiError(400, "Please select at least one trainee to award certificates.", "INVALID_INPUT");
  }

  if (!name || !name.trim()) {
    throw new ApiError(400, "Certificate title is required.", "INVALID_INPUT");
  }

  const issueDate = new Date();
  const certDataList = traineeIds.map((traineeId) => ({
    userId: traineeId,
    issuerId: issuerUserId,
    name: name.trim(),
    issuer: issuer?.trim() || "Capacity Connect LMS",
    issueDate,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    credentialUrl: credentialUrl?.trim() || null,
    templateData: templateData ? (typeof templateData === "string" ? templateData : JSON.stringify(templateData)) : null,
  }));

  await certRepo.createMany(certDataList);

  // Send Notifications to trainees
  const notificationsData = traineeIds.map((traineeId) => ({
    userId: traineeId,
    type: "SYSTEM",
    title: "🎓 Certificate Awarded!",
    body: `You have been awarded the certificate: "${name.trim()}". Check your Certifications page to view and download it.`,
  }));

  await prisma.notification.createMany({
    data: notificationsData,
  });

  return { count: traineeIds.length };
};

const listDistributedCertifications = async (user) => {
  return certRepo.findDistributed(user);
};

const deleteCertification = async (userId, id) => {
  const cert = await certRepo.findById(id);
  if (!cert || cert.userId !== userId) {
    throw new ApiError(404, "Certification not found", "NOT_FOUND");
  }
  await certRepo.remove(id, userId);
  return { deleted: true };
};

module.exports = {
  listMyCertifications,
  listDistributedCertifications,
  createCertification,
  issueCertifications,
  deleteCertification,
};

