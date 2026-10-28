const ResumeModel = require('../models/Resume');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await ResumeModel.getTotalStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await ResumeModel.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
