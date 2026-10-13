import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { Club, Meeting, Membership } from '../../modules/clubs/model.js';
import Book from '../../modules/books/model.js';
import Progress from '../../modules/progress/model.js';
import Excerpt from '../ingest/excerpt.model.js';
import { chat, isOllamaUp } from '../ollama.js';
import { logger } from '../../lib/logger.js';

export async function getTalkingPoints(clubId, meetingId) {
  const club = await Club.findById(clubId);

  if (!club || !club.currentBookId) {
    const error = new Error('This club has no current book.');
    error.status = 400;
    error.code = 'NO_BOOK';
    throw error;
  }

  let chapterLimit = 1;

  // Determine the maximum chapter everyone can discuss.
  if (meetingId) {
    const meeting = await Meeting.findOne({
      _id: meetingId,
      clubId,
    });

    if (!meeting) {
      const error = new Error('Meeting not found.');
      error.status = 404;
      throw error;
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
      chapterLimit = Math.min(
        ...progress.map((item) => item.chapter || 1),
      );
    }
  }

  // Fetch only approved excerpts within the chapter limit.
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

  // Generate questions using Ollama when approved excerpts are available.
  if (excerpts.length && (await isOllamaUp())) {
    try {
      const result = await Promise.race([
        chat.invoke([
          new SystemMessage(
            `Write 5 open discussion questions for a book club. Use only the excerpts. Nothing after chapter ${chapterLimit}. One question per line, no numbers.`,
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
          setTimeout(
            () => reject(new Error('Talking points generation timed out')),
            15000,
          );
        }),
      ]);

      questions = result.content
        .split('\n')
        .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

      if (questions.length === 5) {
        source = 'model';
      } else {
        questions = [];
      }
    } catch (err) {
      logger.warn({ err }, 'talking points fell back to template');
    }
  }

  // Use book moods to create fallback questions.
  if (questions.length !== 5) {
    const book = await Book.findById(club.currentBookId).lean();

    const moods = book?.moods?.length
      ? book.moods.slice(0, 5)
      : [
          'surprising',
          'interesting',
          'emotional',
          'important',
          'unexpected',
        ];

    questions = moods.map(
      (mood) =>
        `Which moment in the first ${chapterLimit} chapters felt most ${mood}, and why?`,
    );

    while (questions.length < 5) {
      questions.push(
        `What did you think about the events in the first ${chapterLimit} chapters?`,
      );
    }

    questions = questions.slice(0, 5);
    source = 'template';
  }

  return {
    chapterLimit,
    questions,
    source,
  };
}