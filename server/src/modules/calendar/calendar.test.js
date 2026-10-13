import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { Club, Membership, Meeting } from '../clubs/model.js';
import { buildIcs } from './ics.js';

const app = createApp();
let club, meeting, otherMeeting;

const url = (clubId, meetingId) => `/api/clubs/${clubId}/meetings/${meetingId}/calendar.ics`;

beforeAll(async () => {
  await startTestDB();
  const creator = new mongoose.Types.ObjectId();
  club = await Club.create({ name: 'Tuesday Mystery Circle', published: true });
  const otherClub = await Club.create({ name: 'Fantasy Friday', published: true });
  meeting = await Meeting.create({
    clubId: club._id,
    date: new Date('2026-10-27T00:00:00Z'),
    time: '18:00',
    location: 'Main store, back room',
    agenda: 'First half of the book',
    chapterRange: { from: 1, to: 10 },
    createdBy: creator,
  });
  otherMeeting = await Meeting.create({
    clubId: otherClub._id,
    date: new Date('2026-10-30T00:00:00Z'),
    time: '17:00',
    createdBy: creator,
  });
});
afterAll(stopTestDB);

describe('buildIcs', () => {
  const text = buildIcs({
    uid: 'abc',
    start: new Date('2026-10-27T12:30:00Z'),
    end: new Date('2026-10-27T14:00:00Z'),
    title: 'Club: Book',
    location: 'Main store, back room',
    description: 'Bring notes; snacks',
  });

  it('is a calendar with CRLF line endings', () => {
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('UID:abc@booklore');
  });

  it('writes dates in UTC and escapes commas and semicolons', () => {
    expect(text).toContain('DTSTART:20261027T123000Z');
    expect(text).toContain('DTEND:20261027T140000Z');
    expect(text).toContain('LOCATION:Main store\\, back room');
    expect(text).toContain('DESCRIPTION:Bring notes\\; snacks');
  });
});

describe('GET calendar.ics', () => {
  it('a member downloads the meeting', async () => {
    const { agent, user } = await loginAs(app);
    await Membership.create({ clubId: club._id, userId: user._id });

    const res = await agent.get(url(club._id, meeting._id));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toContain('booklore-meeting.ics');
    expect(res.text).toContain('SUMMARY:Tuesday Mystery Circle');
    expect(res.text).toContain('Chapters 1 to 10.');
  });

  it('a non-member gets 403', async () => {
    const { agent } = await loginAs(app);
    const res = await agent.get(url(club._id, meeting._id));
    expect(res.status).toBe(403);
  });

  it('a meeting from another club gets 404', async () => {
    const { agent } = await loginAs(app, { moderatorOf: [club._id] });
    const res = await agent.get(url(club._id, otherMeeting._id));
    expect(res.status).toBe(404);
  });

  it('a bad id gets 400', async () => {
    const { agent } = await loginAs(app);
    const res = await agent.get(url('not-an-id', meeting._id));
    expect(res.status).toBe(400);
  });

  it('not logged in gets 401', async () => {
    const res = await request(app).get(url(club._id, meeting._id));
    expect(res.status).toBe(401);
  });
});
