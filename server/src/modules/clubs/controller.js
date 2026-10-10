import { AppError } from '../../lib/AppError.js';

import {
  getPublishedClubs,
  getPublishedClubById,
  joinClub,
  getClubProgress,
  createMeeting,
  getClubMembers,
  updateClub,
  removeClubMember,
  listClubExcerpts,
  updateExcerptApproval,
} from './service.js';

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
  if (result.error === 'REMOVED') {
    throw new AppError('FORBIDDEN', 403, 'You cannot rejoin this club');
  }

  res.ok(result.membership, 201);
};

export const getClubProgressController = async (req, res) => {
  if (!req.user) throw new AppError('UNAUTHENTICATED', 401, 'Please log in');
  res.ok(await getClubProgress(req.params.id, req.user));
};

export const createMeetingController = async (req, res) => {
  const meeting = await createMeeting(req.params.id, req.body, req.user);
  res.ok(meeting, 201);
};

export const getClubMembersController = async (req, res) => {
  const members = await getClubMembers(req.params.id);
  res.ok(members);
};
export const updateClubController = async (req, res) => {
  const club = await updateClub(req.params.id, req.body);
  res.ok(club);
};

export const removeClubMemberController = async (req, res) => {
  await removeClubMember(req.params.id, req.params.userId, req.user._id);
  res.ok({});
};

export const listClubExcerptsController = async (req, res) => {
  const result = await listClubExcerpts(req.params.id, req.query.status ?? 'pending');
  res.ok(result);
};

export const updateExcerptApprovalController = async (req, res) => {
  const result = await updateExcerptApproval(
    req.params.id,
    req.params.excerptId,
    req.body.approved,
    req.user,
  );
  res.ok(result);
};
