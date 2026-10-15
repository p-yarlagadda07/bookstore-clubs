import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { ReadingAgentBody } from '@bookstore/shared/schemas/readingAgent';
import { validate } from '../../middleware/validate.js';
import { runAgent } from './chain.js';
import { startStream, send } from './events.js';
import { getConstraints } from '../../modules/clubs/service.js';
import { withTimeout } from '../timeout.js';

const router = Router();

router.post(
  '/reading-agent',
  requireAuth,
  validate({ body: ReadingAgentBody }),
  async (req, res, next) => {
    let closed = false;

    res.on('close', () => {
      if (!res.writableEnded) closed = true;
    });

    try {
      const { clubId, request } = req.body;

      // Get real club constraints before starting the SSE stream.
      const constraints = await getConstraints(clubId, req.user);

      if (closed) return;

      startStream(res);

      const emit = (event) => {
        if (!closed) {
          send(res, 'tool', event);
        }
      };

      const result = await withTimeout(
        runAgent({
          constraints,
          request,
          emit,
        }),
        45000,
        'Next Read agent',
      );

      if (closed) return;

      send(res, 'final', result);
      res.end();
    } catch (err) {
      if (closed) return;

      if (res.headersSent) {
        send(res, 'error', {
          code: err.code || 'AGENT_FAILED',
          message: err instanceof Error ? err.message : 'Agent failed',
        });
        res.end();
        return;
      }

      next(err);
    }
  },
);

export default router;
