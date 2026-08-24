const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const { requireUser } = require("../../middleware/requireUser");
const { requireApprovedUser } = require("../../middleware/requireApprovedUser");
const { requireRole } = require("../../middleware/requireRole");
const { validate } = require("../../middleware/validate");
const usersController = require("./users.controller");
const {
  listSchema,
  paramsSchema,
  roleSchema,
  rejectSchema,
} = require("./users.validation");

const router = express.Router();

router.use(authenticate, requireUser, requireApprovedUser);

router.get(
  "/users/:id",
  validate(paramsSchema),
  usersController.getUser
);

router.get(
  "/admin/users/pending",
  requireRole("ADMIN"),
  validate(listSchema),
  usersController.listPendingUsers
);

router.get(
  "/admin/users",
  requireRole("ADMIN"),
  validate(listSchema),
  usersController.listAllUsers
);

router.patch(
  "/admin/users/:id/approve",
  requireRole("ADMIN"),
  validate(paramsSchema),
  usersController.approveUser
);

router.patch(
  "/admin/users/:id/reject",
  requireRole("ADMIN"),
  validate(rejectSchema),
  usersController.rejectUser
);

router.patch(
  "/admin/users/:id/suspend",
  requireRole("ADMIN"),
  validate(paramsSchema),
  usersController.suspendUser
);

router.patch(
  "/admin/users/:id/role",
  requireRole("ADMIN"),
  validate(roleSchema),
  usersController.changeRole
);

module.exports = router;
