import { Club, Membership, Meeting } from './model.js';

export const getPublishedClubs = async () => {
  const clubs = await Club.find({ published: true }).lean();

  const items = await Promise.all(
    clubs.map(async (club) => {
      const memberCount = await Membership.countDocuments({
        clubId: club._id,
        status: 'active',
      });

      const nextMeeting = await Meeting.findOne({
        clubId: club._id,
        date: { $gte: new Date() },
      })
        .sort({ date: 1 })
        .lean();

      return {
        id: club._id,
        name: club.name,
        description: club.description,
        rules: club.rules,
        memberCount,
        nextMeeting: nextMeeting
          ? {
              id: nextMeeting._id,
              date: nextMeeting.date,
              time: nextMeeting.time,
              location: nextMeeting.location,
              agenda: nextMeeting.agenda,
            }
          : null,
        currentBook: club.currentBookId
          ? {
              title: club.currentBookId.title,
              author: club.currentBookId.author,
            }
          : null,
      };
    })
  );

  return { items };
};

export const getPublishedClubById = async (id) => {
  const club = await Club.findOne({
    _id: id,
    published: true,
  })
    .populate('currentBookId', 'title author')
    .lean();

  if (!club) {
    return null;
  }

  const meetings = await Meeting.find({
    clubId: club._id,
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .lean();

  return {
    id: club._id,
    name: club.name,
    description: club.description,
    rules: club.rules,
    currentBook: club.currentBookId
      ? {
          title: club.currentBookId.title,
          author: club.currentBookId.author,
        }
      : null,
    meetings: meetings.map((meeting) => ({
      id: meeting._id,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      agenda: meeting.agenda,
    })),
  };
};

export const joinClub = async (clubId, user) => {
  const club = await Club.findOne({
    _id: clubId,
    published: true,
  });

  if (!club) {
    return { error: 'NOT_FOUND' };
  }

  const userId = user?._id || user?.id;

  const existingMembership = await Membership.findOne({
    clubId,
    userId,
  });

  if (existingMembership?.status === 'active') {
    return { error: 'ALREADY_MEMBER' };
  }

  if (existingMembership?.status === 'removed') {
    return { error: 'REMOVED' };
  }

  const membership = await Membership.create({
    clubId,
    userId,
  });

  return { membership };
};