const { asyncHandler } = require("../../utils/asyncHandler");
const resourcesService = require("./resources.service");

const getUploadUrl = asyncHandler(async (req, res) => {
  const result = await resourcesService.getUploadUrl(req.body, req.user);
  res.json({ success: true, data: result });
});

const createResource = asyncHandler(async (req, res) => {
  const resource = await resourcesService.createResource(req.body, req.user);
  res.status(201).json({ success: true, data: resource });
});

const getResource = asyncHandler(async (req, res) => {
  const result = await resourcesService.getResource(req.params.id, req.user);
  res.json({ success: true, data: result });
});

const listCourseResources = asyncHandler(async (req, res) => {
  const data = await resourcesService.listCourseResources(req.params.id, req.user);
  res.json({ success: true, data });
});

const deleteResource = asyncHandler(async (req, res) => {
  await resourcesService.deleteResource(req.params.id, req.user);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = {
  getUploadUrl,
  createResource,
  getResource,
  listCourseResources,
  deleteResource,
};
