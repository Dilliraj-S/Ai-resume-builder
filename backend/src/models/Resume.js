const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ResumeModel {
static async createResume({ userId, sessionId, deviceId, title, templateId, resumeData, atsScore }) {
    const id = uuidv4();
    const sId = sessionId || uuidv4();
    const score = atsScore || 0;
    
    await query(
      `INSERT INTO resumes (id, user_id, session_id, device_id, title, template_id, resume_data, ats_score)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?)`,
      [id, userId || null, sId, deviceId || null, title || 'My Resume', templateId || 'modern-1', JSON.stringify(resumeData || {}), score]
    );
    return this.getResumeById(id);
  }

  static async getResumeById(id, userId = null, deviceId = null) {
    // First try with filters
    let result = await query(
      `SELECT * FROM resumes WHERE id = ? AND (device_id = ? OR user_id = ? OR device_id IS NULL OR device_id = '')`,
      [id, deviceId, userId]
    );
    // If no match, try plain get (for newly created)
    if (!result.rows?.[0]) {
      result = await query(`SELECT * FROM resumes WHERE id = ?`, [id]);
    }
    return result.rows?.[0] || null;
  }

  static async updateResume(id, { title, templateId, resumeData, atsScore, atsFeedback }) {
    const fields = [];
    const values = [];

    if (title !== undefined)       { fields.push('title = ?');        values.push(title); }
    if (templateId !== undefined)  { fields.push('template_id = ?');  values.push(templateId); }
    if (resumeData !== undefined)  { fields.push('resume_data = ?');  values.push(JSON.stringify(resumeData)); }
    if (atsScore !== undefined)    { fields.push('ats_score = ?');    values.push(atsScore); }
    if (atsFeedback !== undefined) { fields.push('ats_feedback = ?'); values.push(JSON.stringify(atsFeedback)); }

    if (fields.length === 0) return null;

    values.push(id);
    await query(`UPDATE resumes SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getResumeById(id);
  }

  static async deleteResume(id, deviceId) {
    const resume = await this.getResumeById(id);
    if (!resume) return false;
    if (!resume.device_id || resume.device_id === deviceId) {
      const result = await query(`DELETE FROM resumes WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    }
    return false;
  }

  static async deleteResumeById(id) {
    const result = await query(`DELETE FROM resumes WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static async getResumesBySession(sessionId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT id, title, template_id, ats_score, created_at, updated_at
       FROM resumes
       WHERE session_id = ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [sessionId, limit, offset]
    );
    return result.rows || [];
  }

  static async getResumesByUserId(userId, limit = 100, offset = 0) {
    const result = await query(
      `SELECT id, title, template_id, ats_score, resume_data, created_at, updated_at
       FROM resumes
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return result.rows || [];
  }

  static async getResumesByDevice(deviceId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT id, title, template_id, ats_score, created_at, updated_at
       FROM resumes
       WHERE device_id = ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [deviceId, limit, offset]
    );
    return result.rows || [];
  }

  static async incrementDownload(resumeId, sessionId, deviceId, format = 'pdf') {
    await query(`UPDATE resumes SET download_count = download_count + 1 WHERE id = ?`, [resumeId]);
    await query(
      `INSERT INTO download_logs (resume_id, session_id, device_id, format) VALUES (?, ?, ?, ?)`,
      [resumeId, sessionId, deviceId, format]
    );
  }

  static async logAiUsage({ resumeId, sessionId, deviceId, feature, tokensUsed }) {
    await query(
      `INSERT INTO ai_usage_logs (resume_id, session_id, device_id, feature, tokens_used)
       VALUES (?, ?, ?, ?, ?)`,
      [resumeId || null, sessionId || null, deviceId || null, feature, tokensUsed || 0]
    );
  }

  static async getAnalytics() {
    const result = await query(`SELECT * FROM resume_analytics LIMIT 30`);
    return result.rows || [];
  }

  static async getTotalStats() {
    const result = await query(
      `SELECT
         COUNT(DISTINCT r.id)       AS total_resumes,
         COUNT(DISTINCT r.device_id) AS total_devices,
         COALESCE(SUM(r.download_count), 0)       AS total_downloads,
         COALESCE(AVG(r.ats_score), 0)            AS avg_ats_score,
         COUNT(DISTINCT a.id)        AS total_ai_requests
       FROM resumes r
       LEFT JOIN ai_usage_logs a ON a.resume_id = r.id`
    );
    return result.rows?.[0];
  }
}

module.exports = ResumeModel;