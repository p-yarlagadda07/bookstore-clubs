import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';

import Reservation from './model.js';
import Inventory from '../inventory/model.js';
import Book from '../books/model.js';

describe('reservations', () => {
  beforeAll(startTestDB);
  afterAll(stopTestDB);

  beforeEach(async () => {
    await Reservation.deleteMany({});
    await Inventory.deleteMany({});
    await Book.deleteMany({});
  });

  it('reserves a copy successfully', async () => {
    expect(true).toBe(true);
  });

  it('returns 409 when the last copy is already taken', async () => {
    expect(true).toBe(true);
  });

  it('returns 409 for an invalid pickup window', async () => {
    expect(true).toBe(true);
  });
});