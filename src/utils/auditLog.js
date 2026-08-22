const { prisma } = require("../database/prisma");

const createAuditLog = async (actorId, action, targetType, targetId, metadata, tx) => {
  const client = tx || prisma;
  return client.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata,
    },
  });
};

module.exports = { createAuditLog };
