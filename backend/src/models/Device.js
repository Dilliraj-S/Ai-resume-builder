const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { PRICING } = require('../constants');

class DeviceModel {
  static async createOrGet(deviceId) {
    const result = await query(`SELECT * FROM devices WHERE device_id = ?`, [deviceId]);
    const existing = result.rows?.[0];
    if (existing) return existing;
    
    // Create new device with free tier defaults
    await query(
       `INSERT INTO devices (device_id, plan, ai_credits, total_credits, ats_checks_used, ats_checks_limit, downloads_used, downloads_limit) VALUES (?, 'free', 5, 5, 0, 3, 0, 0)`,
       [deviceId]
    );
    const newResult = await query(`SELECT * FROM devices WHERE device_id = ?`, [deviceId]);
    return newResult.rows?.[0];
  }

  static async getById(deviceId) {
    const result = await query(`SELECT * FROM devices WHERE device_id = ?`, [deviceId]);
    return result.rows?.[0] || null;
  }

  static async checkCredits(deviceId) {
    const r = await query(`SELECT ai_credits FROM devices WHERE device_id = ?`, [deviceId]);
    return r.rows?.[0]?.ai_credits ?? 0;
  }

  static async deductCredit(deviceId) {
    const r = await query(
      `UPDATE devices SET ai_credits = ai_credits - 1 WHERE device_id = ? AND ai_credits > 0`,
      [deviceId]
    );
    return r.affectedRows > 0;
  }

  static async addCredit(deviceId, amount = 1) {
    await query(
      `UPDATE devices SET ai_credits = ai_credits + ? WHERE device_id = ?`,
      [amount, deviceId]
    );
    return true;
  }

  static async canDownload(deviceId) {
    const r = await query(
      `SELECT plan, downloads_used, downloads_limit FROM devices WHERE device_id = ?`,
      [deviceId]
    );
    const row = r.rows?.[0];
    if (!row) return { canDownload: false, reason: 'no_device' };
    if (row.downloads_limit === -1) return { canDownload: true, reason: 'unlimited' };
    if (row.downloads_used < row.downloads_limit) {
      return { canDownload: true, reason: 'limited', remaining: row.downloads_limit - row.downloads_used };
    }
    return { canDownload: false, reason: 'limit_exceeded' };
  }

  static async checkAtsChecks(deviceId) {
    const r = await query(
      `SELECT ats_checks_used, ats_checks_limit FROM devices WHERE device_id = ?`,
      [deviceId]
    );
    const row = r.rows?.[0];
    if (!row) return { canCheck: false, reason: 'no_device' };
    if (row.ats_checks_limit === -1) return { canCheck: true, reason: 'unlimited' };
    if (row.ats_checks_used < row.ats_checks_limit) return { canCheck: true, reason: 'limited' };
    return { canCheck: false, reason: 'limit_exceeded' };
  }

  static async incrementDownload(deviceId) {
    await query(
      `UPDATE devices SET downloads_used = downloads_used + 1 WHERE device_id = ? AND downloads_limit != -1`,
      [deviceId]
    );
    return true;
  }

  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_devices,
        COUNT(CASE WHEN plan = 'single' THEN 1 END) as single_devices,
        COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_devices
      FROM devices
    `);
    return result.rows?.[0];
  }
}

module.exports = DeviceModel;