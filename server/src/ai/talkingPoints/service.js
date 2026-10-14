import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { AppError } from '../../lib/AppError.js';
import { logger } from '../../lib/logger.js';
import { Club, Meeting, Membership } from '../../modules/clubs/model.js';
import Book from '../../modules/books/model.js';
import Progress from '../../modules/progress/model.js';
import Excerpt from '../ingest/excerpt.model.js';
import { chat, isOllamaUp } from '../ollama.js';

export async function getTalkingPoints(clubId, meetingId) {
  const club = await Club.findById(clubId);

  if (!club || !club.currentBookId) {
    throw new AppError('NO_BOOK', 400, 'This club has no current book');
  }

  let chapterLimit = 1;

  if (meetingId) {
    const meeting = await Meeting.findOne({
      _id: meetingId,
      clubId,
    });

    if (!meeting) {
      throw new AppError('NOT_FOUND', 404, 'Meeting not found');
    }

    chapterLimit = meeting.chapterRange?.to || 1;
  } else {
    const memberships = await Membership.find({
      clubId,
      status: 'active',
    }).select('userId');

    const userIds = memberships.map((membership) => membership.userId);

    const progress = await Progress.find({
      clubId,
      bookId: club.currentBookId,
      userId: { $in: userIds },
    })
      .select('chapter')
      .lean();

    if (progress.length) {
      chapterLimit = Math.min(...progress.map((item) => item.chapter || 1));
    }
  }

  const excerpts = await Excerpt.find({
    bookId: club.currentBookId,
    chapter: { $lte: chapterLimit },
    approved: true,
  })
    .sort({ chapter: 1 })
    .limit(6)
    .lean();

  let questions = [];
  let source = 'template';

  if (excerpts.length && (await isOllamaUp())) {
    try {
      const result = await Promise.race([
        chat.invoke([
          new SystemMessage(
            `Write 5 distinct, open discussion questions for a book club. Use only the approved excerpts. Do not discuss anything after chapter ${chapterLimit}. Each question must explore a different topic. Return one question per line without numbering.`,
          ),
          new HumanMessage(
            JSON.stringify({
              chapterLimit,
              excerpts: excerpts.map((excerpt) => ({
                chapter: excerpt.chapter,
                text: excerpt.text,
              })),
            }),
          ),
        ]),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Talking points generation timed out')), 15000);
        }),
      ]);

      questions = result.content
        .split('\n')
        .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
        .filter(Boolean);

      questions = [...new Set(questions)].slice(0, 5);

      if (questions.length === 5) {
        source = 'model';
      } else {
        questions = [];
      }
    } catch (err) {
      logger.warn({ err }, 'talking points fell back to template');
    }
  }

  if (questions.length !== 5) {
    const book = await Book.findById(club.currentBookId).lean();

    const moods = book?.moods?.length
      ? book.moods.slice(0, 5)
      : ['suspenseful', 'atmospheric', 'surprising', 'emotional', 'mysterious'];

    const templates = [
      (mood) => `Which moment in the first ${chapterLimit} chapters felt most ${mood}, and why?`,
      (mood) => `How does the ${mood} mood affect your expectations for what happens next?`,
      (mood) => `Which character or event best represents the ${mood} mood so far?`,
      (mood) => `What detail makes the story feel ${mood} in these chapters?`,
      (mood) => `What would you like to discuss about the ${mood} atmosphere of the story?`,
    ];

    questions = templates.map((template, index) => template(moods[index] || 'interesting'));

    source = 'template';
  }

  return {
    chapterLimit,
    questions,
    source,
  };
}
