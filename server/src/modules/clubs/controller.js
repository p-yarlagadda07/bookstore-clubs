import { AppError } from '../../lib/AppError.js';
import { getPublishedClubs, getPublishedClubById, joinClub } from './service.js';

export const listClubs = async (_req, res) => {
  res.ok(await getPublishedClubs());
};

export const getClub = async (req, res) => {
  const club = await getPublishedClubById(req.params.id);
  if (!club) throw new AppError('NOT_FOUND', 404, 'Club not found');
  res.ok(club);
};

export const joinClubController = async (req, res) => {
  const result = await joinClub(req.params.id, req.user);

  if (result.error === 'NOT_FOUND') throw new AppError('NOT_FOUND', 404, 'Club not found');
  if (result.error === 'ALREADY_MEMBER') {
    throw new AppError('CONFLICT', 409, 'Already a member of this club');
  }
  if (result.error === 'REMOVED')
    throw new AppError('FORBIDDEN', 403, 'You cannot rejoin this club');

  res.ok(result.membership, 201);
};
