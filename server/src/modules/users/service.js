import { User } from './model.js';
import { Club } from '../clubs/model.js';
import { AppError } from '../../lib/AppError.js';
import { logAudit } from '../audit/service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function toItem(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    roles: u.roles,
    moderatorOf: (u.moderatorOf ?? []).filter(Boolean).map((c) => ({ id: c._id, name: c.name })),
  };
}

export async function listUsers({ q } = {}) {
  const re = q ? new RegExp(escapeRegex(q), 'i') : null;
  const filter = re ? { $or: [{ name: re }, { email: re }] } : {};
  const users = await User.find(filter)
    .sort({ name: 1 })
    .limit(50)
    .populate('moderatorOf', 'name')
    .lean();
  return { items: users.map(toItem) };
}

export async function changeStaffRole(actor, targetId, { action, role, clubId }) {
  if (String(targetId) === String(actor._id)) {
    throw new AppError('FORBIDDEN', 403, "You can't change your own roles");
  }

  const target = await User.findById(targetId).lean();
  if (!target) throw new AppError('NOT_FOUND', 404, 'User not found');

  let update;
  if (role === 'bookseller') {
    update =
      action === 'grant'
        ? { $addToSet: { roles: 'bookseller' } }
        : { $pull: { roles: 'bookseller' } };
  } else {
    if (!(await Club.exists({ _id: clubId })))
      throw new AppError('NOT_FOUND', 404, 'Club not found');
    update =
      action === 'grant'
        ? { $addToSet: { moderatorOf: clubId } }
        : { $pull: { moderatorOf: clubId } };
  }

  const updated = await User.findByIdAndUpdate(targetId, update, { new: true })
    .populate('moderatorOf', 'name')
    .lean();

  await logAudit(
    actor,
    'role.change',
    { type: 'user', id: target._id },
    {
      reason: `${action} ${role}`,
      before: { roles: target.roles, moderatorOf: (target.moderatorOf ?? []).map(String) },
      after: { roles: updated.roles, moderatorOf: updated.moderatorOf.map((c) => String(c._id)) },
    },
  );

  return toItem(updated);
}
