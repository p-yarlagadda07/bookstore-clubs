export const getSubscription = async (req, res) => {
  res.ok({ status: 'active', plan: 'standard' });
};

export const updateSubscription = async (req, res) => {
  res.ok({ status: 'updated' });
};

export const handleWebhook = async (req, res) => {
  res.ok({ received: true });
};