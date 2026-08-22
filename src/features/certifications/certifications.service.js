const { ApiError } = require("../../utils/ApiError");
const certRepo = require("./certifications.repository");

const listMyCertifications = async (userId) => {
  return certRepo.findByUser(userId);
};

const createCertification = async (userId, data) => {
  return certRepo.create({ userId, ...data });
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
  createCertification,
  deleteCertification,
};
