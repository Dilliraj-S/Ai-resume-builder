const PRICING = {
  free: { amount: 0, downloadsLimit: 0, atsChecksLimit: 3, aiCredits: 5, name: 'Free' },
  single: { amount: 49, downloadsLimit: 3, atsChecksLimit: 10, aiCredits: 10, name: 'Starter' },
  pro: { amount: 99, downloadsLimit: -1, atsChecksLimit: -1, aiCredits: 50, name: 'Pro Plan' },
};

module.exports = { PRICING };