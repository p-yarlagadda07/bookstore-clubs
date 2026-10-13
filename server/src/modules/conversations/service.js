import { Conversation } from './model.js';
import { AppError } from '../../lib/AppError.js';

export async function saveTurn(user, { conversationId, kind, bookId, clubId }, question, result) {
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user._id,
    });

    if (!conversation) {
      throw new AppError('NOT_FOUND', 404, 'Conversation not found');
    }
  } else {
    conversation = new Conversation({
      userId: user._id,
      kind,
      bookId: bookId || null,
      clubId: clubId || null,
      messages: [],
    });
  }

  conversation.messages.push(
    {
      role: 'user',
      text: question,
      status: 'answered',
      citations: [],
      at: new Date(),
    },
    {
      role: 'assistant',
      text: result.answer,
      status: result.status,
      citations: result.citations || [],
      at: new Date(),
    },
  );

  if (conversation.messages.length > 50) {
    conversation.messages = conversation.messages.slice(-50);
  }

  await conversation.save();
  return conversation._id.toString();
}

export async function listMine(user) {
  const conversations = await Conversation.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return {
    items: conversations.map((conversation) => {
      const lastMessage = conversation.messages.at(-1);

      return {
        id: conversation._id.toString(),
        kind: conversation.kind,
        bookId: conversation.bookId?.toString() || null,
        lastMessage: lastMessage?.text || '',
        updatedAt: conversation.updatedAt,
      };
    }),
  };
}

export async function getOne(user, id) {
  const conversation = await Conversation.findOne({
    _id: id,
    userId: user._id,
  }).lean();

  if (!conversation) {
    throw new AppError('NOT_FOUND', 404, 'Conversation not found');
  }

  return {
    ...conversation,
    id: conversation._id.toString(),
  };
}
