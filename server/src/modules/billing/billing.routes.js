import express from 'express';
import { getSubscription, updateSubscription, handleWebhook } from './billing.controller.js';

const router = express.Router();


// Fetch current user's subscription status
router.get('/me', getSubscription);

// Create or update subscription plan
router.post('/subscribe', updateSubscription);

// Payment webhook handler (mock/local integration)
router.post('/webhook', handleWebhook);

export default router;