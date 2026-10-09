import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';

import { Club, Membership, Meeting } from '../../modules/clubs/model.js';
import Book from '../../modules/books/model.js';
import Inventory from '../../modules/inventory/model.js';

import { runAgent } from './chain.js';

const app = createApp();

let popularBook;
let shortBook;

beforeAll(async () => {
  await startTestDB();

  [popularBook, shortBook] = await Book.create([
    {
      title: "The Lantern Keeper's Secret",
      authors: ['Test Author'],
      themes: ['mystery'],
      moods: ['suspenseful'],
      synopsis: 'A mystery involving a lantern keeper and a hidden secret.',
      pageCount: 380,
      readingHours: 9.5,
      approvedSource: true,
    },
    {
      title: 'Murder at Platform Nine',
      authors: ['Test Author'],
      themes: ['mystery'],
      moods: ['suspenseful'],
      synopsis: 'A short mystery set at a railway station.',
      pageCount: 220,
      readingHours: 5.5,
      approvedSource: true,
    },
  ]);

  await Inventory.create([
    {
      bookId: popularBook._id,
      condition: 'new',
      total: 3,
      available: 3,
      held: 0,
      status: 'active',
    },
    {
      bookId: shortBook._id,
      condition: 'new',
      total: 10,
      available: 10,
      held: 0,
      status: 'active',
    },
  ]);
});

afterAll(async () => {
  await stopTestDB();
});

describe('reading agent route', () => {
  it('streams tool events and returns the correct shortlist', async () => {
    const { agent, csrf, user } = await loginAs(app);

    const club = await Club.create({
      name: 'Test Reading Club',
      description: 'Reading agent test club',
      published: true,
      readingPace: {
        pagesPerWeek: 120,
      },
    });

    await Membership.create({
      clubId: club._id,
      userId: user._id,
      status: 'active',
    });

    const extraUsers = await Promise.all(Array.from({ length: 7 }, () => loginAs(app)));

    await Membership.insertMany(
      extraUsers.map(({ user: extraUser }) => ({
        clubId: club._id,
        userId: extraUser._id,
        status: 'active',
      })),
    );

    await Meeting.create({
      clubId: club._id,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: user._id,
    });

    const res = await agent
      .post('/api/reading-agent')
      .set('x-csrf-token', csrf)
      .send({
        clubId: String(club._id),
        request: 'short mystery',
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('event: tool');
    expect((res.text.match(/event: final/g) || []).length).toBe(1);

    const finalMatch = res.text.match(/event: final\ndata: (.+)\n\n/);

    expect(finalMatch).not.toBeNull();

    const finalData = JSON.parse(finalMatch[1]);
    const titles = finalData.shortlist.map((book) => book.title);

    expect(titles).toContain('Murder at Platform Nine');
    expect(titles).not.toContain("The Lantern Keeper's Secret");
  });

  it('rejects a request from a user who is not a club member', async () => {
    const { agent, csrf } = await loginAs(app);
    const { user: member } = await loginAs(app);

    const club = await Club.create({
      name: 'Member Only Club',
      published: true,
      readingPace: {
        pagesPerWeek: 120,
      },
    });

    await Membership.create({
      clubId: club._id,
      userId: member._id,
      status: 'active',
    });

    await Meeting.create({
      clubId: club._id,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: member._id,
    });

    const res = await agent
      .post('/api/reading-agent')
      .set('x-csrf-token', csrf)
      .send({
        clubId: String(club._id),
        request: 'short mystery',
      });

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('rejects a request from a user who is not logged in', async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/auth/csrf');
    const csrf = csrfRes.body.data.token;

    const res = await agent.post('/api/reading-agent').set('x-csrf-token', csrf).send({
      clubId: new mongoose.Types.ObjectId().toString(),
      request: 'short mystery',
    });

    expect(res.status).toBe(401);
  });

  it('rejects a request with an invalid club id', async () => {
    const { agent, csrf } = await loginAs(app);

    const res = await agent.post('/api/reading-agent').set('x-csrf-token', csrf).send({
      clubId: 'not-a-valid-object-id',
      request: 'short mystery',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a request shorter than 3 characters', async () => {
    const { agent, csrf } = await loginAs(app);

    const res = await agent.post('/api/reading-agent').set('x-csrf-token', csrf).send({
      clubId: new mongoose.Types.ObjectId().toString(),
      request: 'hi',
    });

    expect(res.status).toBe(400);
  });
});

describe('runAgent', () => {
  it('returns only books that fit copies and reading time', async () => {
    const events = [];

    const result = await runAgent({
      constraints: {
        memberCount: 8,
        pagesPossible: 240,
      },
      request: 'short mystery',
      emit: (event) => events.push(event),
    });

    expect(result.shortlist.length).toBeGreaterThan(0);

    expect(result.shortlist.some((book) => book.title === 'Murder at Platform Nine')).toBe(true);

    expect(result.shortlist.some((book) => book.title === "The Lantern Keeper's Secret")).toBe(
      false,
    );

    expect(events).toHaveLength(6);
    expect(events[0].name).toBe('searchCatalog');
    expect(events[1].name).toBe('searchCatalog');
    expect(events[2].name).toBe('checkStockAndLength');
    expect(events[3].name).toBe('checkStockAndLength');
    expect(events[4].name).toBe('compareClubConstraints');
    expect(events[5].name).toBe('compareClubConstraints');
  });
});
