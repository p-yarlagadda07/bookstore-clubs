import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { Conversation } from './model.js';
import { saveTurn } from './service.js';

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(async () => {
  await Conversation.deleteMany({});
});

describe('conversation service', () => {
  it('creates a conversation and saves the user and assistant messages', async () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    const id = await saveTurn(user, { kind: 'shop' }, 'What is your return policy?', {
      answer: 'Returns are accepted within 7 days [1].',
      status: 'answered',
      citations: [{ n: 1, kind: 'policy', title: 'Returns' }],
    });

    const conversation = await Conversation.findById(id).lean();
    expect(conversation.kind).toBe('shop');
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[0]).toMatchObject({
      role: 'user',
      text: 'What is your return policy?',
    });
    expect(conversation.messages[1]).toMatchObject({
      role: 'assistant',
      text: 'Returns are accepted within 7 days [1].',
      status: 'answered',
    });
  });

  it('adds another turn to the same conversation', async () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    const firstId = await saveTurn(user, { kind: 'shop' }, 'First question', {
      answer: 'First answer',
      status: 'answered',
      citations: [],
    });
    const secondId = await saveTurn(
      user,
      { conversationId: firstId, kind: 'shop' },
      'Second question',
      { answer: 'Second answer', status: 'answered', citations: [] },
    );

    expect(secondId).toBe(firstId);
    const conversation = await Conversation.findById(firstId).lean();
    expect(conversation.messages).toHaveLength(4);
    expect(conversation.messages[2].text).toBe('Second question');
    expect(conversation.messages[3].text).toBe('Second answer');
  });

  it('does not allow another user to save a turn in someone else’s conversation', async () => {
    const owner = { _id: new mongoose.Types.ObjectId() };
    const otherUser = { _id: new mongoose.Types.ObjectId() };
    const id = await saveTurn(owner, { kind: 'shop' }, 'Question', {
      answer: 'Answer',
      status: 'answered',
      citations: [],
    });

    await expect(
      saveTurn(otherUser, { conversationId: id, kind: 'shop' }, 'Unauthorized question', {
        answer: 'Unauthorized answer',
        status: 'answered',
        citations: [],
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('keeps only the latest 50 messages', async () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    const id = await saveTurn(user, { kind: 'shop' }, 'Question 1', {
      answer: 'Answer 1',
      status: 'answered',
      citations: [],
    });

    for (let i = 2; i <= 26; i += 1) {
      await saveTurn(user, { conversationId: id, kind: 'shop' }, `Question ${i}`, {
        answer: `Answer ${i}`,
        status: 'answered',
        citations: [],
      });
    }

    const conversation = await Conversation.findById(id).lean();
    expect(conversation.messages).toHaveLength(50);
    expect(conversation.messages[0].text).toBe('Question 2');
    expect(conversation.messages[49].text).toBe('Answer 26');
  });
});

describe('conversation routes', () => {
  it('requires login to list conversations', async () => {
    const app = createApp();
    const response = await (await import('supertest')).default(app).get('/api/conversations/mine');

    expect(response.status).toBe(401);
  });

  it('lists only the logged-in user’s conversations, newest first', async () => {
    const app = createApp();
    const { agent, user } = await loginAs(app);

    await saveTurn({ _id: user._id }, { kind: 'shop' }, 'Older question', {
      answer: 'Older answer',
      status: 'answered',
      citations: [],
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await saveTurn(
      { _id: user._id },
      { kind: 'book', bookId: new mongoose.Types.ObjectId() },
      'Newer question',
      { answer: 'Newer answer', status: 'answered', citations: [] },
    );
    await saveTurn(
      { _id: new mongoose.Types.ObjectId() },
      { kind: 'shop' },
      'Another user question',
      { answer: 'Another user answer', status: 'answered', citations: [] },
    );

    const response = await agent.get('/api/conversations/mine');

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0].lastMessage).toBe('Newer answer');
    expect(response.body.data.items[1].lastMessage).toBe('Older answer');
  });

  it('returns a conversation to its owner only', async () => {
    const app = createApp();
    const owner = await loginAs(app);
    const other = await loginAs(app);

    const id = await saveTurn({ _id: owner.user._id }, { kind: 'shop' }, 'My question', {
      answer: 'My answer',
      status: 'answered',
      citations: [],
    });

    const ownResponse = await owner.agent.get(`/api/conversations/${id}`);
    expect(ownResponse.status).toBe(200);
    expect(ownResponse.body.data.messages).toHaveLength(2);

    const otherResponse = await other.agent.get(`/api/conversations/${id}`);
    expect(otherResponse.status).toBe(404);
  });
});
