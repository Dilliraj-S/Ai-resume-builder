const { generatePDF, buildResumeHTML } = require('../services/pdf.service');
const ResumeModel = require('../models/Resume');
const DeviceModel = require('../models/Device');
const logger = require('../utils/logger');

exports.downloadPDF = async (req, res, next) => {
  try {
    const { resumeData, templateId, filename, templateMeta, htmlContent } = req.body;
    const sessionId = req.headers['x-session-id'];

    logger.debug('PDF Download request', { 
      deviceId: req.device?.deviceId, 
      plan: req.device?.plan,
      templateId 
    });

    if (!resumeData) {
      logger.error('PDF Download: No resumeData provided');
      return res.status(400).json({ success: false, error: 'Resume data is required' });
    }

    if (!templateId && !htmlContent) {
      logger.error('PDF Download: No templateId or htmlContent');
      return res.status(400).json({ success: false, error: 'Template ID or HTML content required' });
    }

    const device = await DeviceModel.getById(req.device.deviceId);
    logger.debug('PDF Download device check', {
      deviceId: device?.device_id,
      plan: device?.plan,
      downloads: `${device?.downloads_used}/${device?.downloads_limit}`
    });

    const canDownload = await DeviceModel.canDownload(req.device.deviceId);
    if (!canDownload.canDownload) {
      logger.warn('PDF Download blocked', { reason: canDownload.reason });
      return res.status(403).json({
        success: false,
        error: canDownload.reason === 'limit_exceeded' 
          ? 'Download limit exceeded. Please purchase a plan to continue.' 
          : 'Payment required to download PDF',
        code: canDownload.reason,
        downloadsUsed: device?.downloads_used || 0,
        downloadsLimit: device?.downloads_limit || 0,
      });
    }

    const html = htmlContent || buildResumeHTML(resumeData, templateId || 'modern-01', templateMeta);
    const pdfOptions = htmlContent ? {
      marginTop: '0mm',
      marginRight: '0mm',
      marginBottom: '0mm',
      marginLeft: '0mm',
    } : {};
    const pdfBuffer = await generatePDF(html, pdfOptions);

    if (req.body.resumeId && sessionId) {
      await ResumeModel.incrementDownload(req.body.resumeId, sessionId, req.device.deviceId, 'pdf');
    }

    await DeviceModel.incrementDownload(req.device.deviceId);

    const name = filename || `${resumeData.basicInfo?.fullName?.replace(/\s+/g, '_') || 'resume'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('PDF download error:', error);
    next(error);
  }
};

exports.previewPDF = async (req, res, next) => {
  try {
    const { resumeData, templateId, templateMeta, htmlContent } = req.body;
    const html = htmlContent || buildResumeHTML(resumeData, templateId || 'modern-01', templateMeta);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};
