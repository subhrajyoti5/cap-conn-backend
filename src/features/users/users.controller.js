const { asyncHandler } = require("../../utils/asyncHandler");
const usersService = require("./users.service");

const listPendingUsers = asyncHandler(async (req, res) => {
  const result = await usersService.getPendingUsers(req.validated.query);
  res.json({ success: true, ...result });
});

const approveUser = asyncHandler(async (req, res) => {
  const user = await usersService.approveUser(req.params.id, req.user.id);
  res.json({ success: true, data: user });
});

const rejectUser = asyncHandler(async (req, res) => {
  const user = await usersService.rejectUser(
    req.params.id,
    req.body.reason,
    req.user.id
  );
  res.json({ success: true, data: user });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await usersService.suspendUser(req.params.id, req.user.id);
  res.json({ success: true, data: user });
});

const changeRole = asyncHandler(async (req, res) => {
  const user = await usersService.changeUserRole(
    req.params.id,
    req.body.role,
    req.user.id
  );
  res.json({ success: true, data: user });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id, req.user);
  res.json({ success: true, data: user });
});

module.exports = {
  listPendingUsers,
  approveUser,
  rejectUser,
  suspendUser,
  changeRole,
  getUser,
};
