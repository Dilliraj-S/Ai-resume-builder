const PRICING = {
  single: {
    name: 'Starter Plan',
    amount: 49,
    credits: 10,
    downloads: 3,
    atsChecks: 10,
  },
  pro: {
    name: 'Pro Plan',
    amount: 99,
    credits: 50,
    downloads: -1,
    atsChecks: -1,
  },
  onetime: {
    name: 'One-Time Download',
    amount: 19,
    credits: 0,
    downloads: 1,
    atsChecks: 0,
  },
};

module.exports = { PRICING };