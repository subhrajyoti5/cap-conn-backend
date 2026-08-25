const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const profilesController = require("./profiles.controller");
const {
  profileSchema,
  qualificationSchema,
  experienceSchema,
  nameSchema,
  idSchema,
  userIdSchema,
  competencySchema,
} = require("./profiles.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router
  .route("/profiles/me")
  .get(profilesController.getMyProfile)
  .put(validate(profileSchema), profilesController.updateMyProfile);

router
  .route("/profiles/me/qualifications")
  .get(profilesController.listQualifications)
  .post(validate(qualificationSchema), profilesController.addQualification);

router.delete(
  "/profiles/me/qualifications/:id",
  validate(idSchema),
  profilesController.removeQualification
);

router
  .route("/profiles/me/work-experience")
  .get(profilesController.listWorkExperience)
  .post(validate(experienceSchema), profilesController.addWorkExperience);

router.delete(
  "/profiles/me/work-experience/:id",
  validate(idSchema),
  profilesController.removeWorkExperience
);

router
  .route("/profiles/me/skills")
  .get(profilesController.listSkills)
  .post(validate(nameSchema), profilesController.addSkill);

router.delete(
  "/profiles/me/skills/:id",
  validate(idSchema),
  profilesController.removeSkill
);

router
  .route("/profiles/me/interests")
  .get(requireRole("TRAINEE"), profilesController.listInterests)
  .post(requireRole("TRAINEE"), validate(nameSchema), profilesController.addInterest);

router.delete(
  "/profiles/me/interests/:id",
  requireRole("TRAINEE"),
  validate(idSchema),
  profilesController.removeInterest
);

router
  .route("/profiles/me/competencies")
  .get(requireRole("TRAINER"), profilesController.listMyCompetencies)
  .post(requireRole("TRAINER"), validate(competencySchema), profilesController.addMyCompetency);

router.delete(
  "/profiles/me/competencies/:id",
  requireRole("TRAINER"),
  validate(idSchema),
  profilesController.removeMyCompetency
);

router.get(
  "/profiles/trainers/:userId",
  validate(userIdSchema),
  profilesController.getTrainerProfilePublic
);

router.get(
  "/profiles/trainees/:userId",
  validate(userIdSchema),
  profilesController.getTraineeProfilePublic
);

module.exports = router;
