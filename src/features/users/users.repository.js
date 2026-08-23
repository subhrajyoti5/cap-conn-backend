const { prisma } = require("../../database/prisma");

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
};

const findPendingUsers = async ({ page, limit }) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: { status: "PENDING" },
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { status: "PENDING" } }),
  ]);
  return { data, meta: { page, limit, total } };
};

const updateUserStatus = async (id, status, tx) => {
  const client = tx || prisma;
  return client.user.update({
    where: { id },
    data: { status },
  });
};

const updateUserRole = async (id, role, tx) => {
  const client = tx || prisma;
  return client.user.update({
    where: { id },
    data: { role },
  });
};

module.exports = {
  findUserById,
  findPendingUsers,
  updateUserStatus,
  updateUserRole,
};
