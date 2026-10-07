import {
  getPublishedClubs,
  getPublishedClubById,
  joinClub,
} from './service.js';

export const listClubs = async (_req, res, next) => {
  try {
    const result = await getPublishedClubs();
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const getClub = async (req, res, next) => {
  try {
    const club = await getPublishedClubById(req.params.id);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    return res.json(club);
  } catch (error) {
    return next(error);
  }
};

export const joinClubController = async (req, res, next) => {
  try {
    const result = await joinClub(req.params.id, req.user);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (result.error === 'ALREADY_MEMBER') {
      return res.status(409).json({
        message: 'Already a member of this club',
      });
    }

    if (result.error === 'REMOVED') {
      return res.status(403).json({
        message: 'You cannot rejoin this club',
      });
    }

    return res.ok(result.membership, 201);
  } catch (error) {
    return next(error);
  }
};