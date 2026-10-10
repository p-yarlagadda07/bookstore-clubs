import { AuditLog } from './model.js';
import { logger } from '../../lib/logger.js';

// a failed audit write should never break the real action, so this never throws
export async function logAudit(actor, action, { type, id } = {}, details = {}) {
  try {
    return await AuditLog.create({
      actorId: actor?._id ?? actor,
      action,
      targetType: type,
      targetId: id,
      details,
    });
  } catch (err) {
    logger.error({ err, action }, 'audit log failed');
    return null;
  }
}

export async function listAudit({ page = 1, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(),
  ]);
  return { items, page, limit, total };
}
