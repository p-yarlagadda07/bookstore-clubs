import { Subscription } from './billing.model.js';

export const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    res.status(200).json(subscription || { plan: 'free', status: 'active' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      { plan, status: 'active' },
      { new: true, upsert: true }
    );
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};