const { asyncHandler } = require("../../utils/asyncHandler");
const certService = require("./certifications.service");

const listCertifications = asyncHandler(async (req, res) => {
  const data = await certService.listMyCertifications(req.user.id);
  res.json({ success: true, data });
});

const createCertification = asyncHandler(async (req, res) => {
  const item = await certService.createCertification(req.user.id, req.body);
  res.status(201).json({ success: true, data: item });
});

const issueCertifications = asyncHandler(async (req, res) => {
  const result = await certService.issueCertifications(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

const listDistributedCertifications = asyncHandler(async (req, res) => {
  const data = await certService.listDistributedCertifications(req.user);
  res.json({ success: true, data });
});

const deleteCertification = asyncHandler(async (req, res) => {
  await certService.deleteCertification(req.user.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = {
  listCertifications,
  listDistributedCertifications,
  createCertification,
  issueCertifications,
  deleteCertification,
};

