const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { validate } = require("../../middleware/validate");
const certController = require("./certifications.controller");
const { certificationSchema, idSchema } = require("./certifications.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router
  .route("/certifications")
  .get(certController.listCertifications)
  .post(validate(certificationSchema), certController.createCertification);

router.get("/certifications/distributed", certController.listDistributedCertifications);
router.post("/certifications/issue", certController.issueCertifications);

router.delete(
  "/certifications/:id",
  validate(idSchema),
  certController.deleteCertification
);

module.exports = router;

