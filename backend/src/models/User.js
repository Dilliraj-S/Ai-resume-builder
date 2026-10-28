const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class UserModel {
  static async create({ email, name, googleId, avatar }) {
    const id = uuidv4();
    const password = googleId ? null : await bcrypt.hash(uuidv4().slice(0, 8), 10);
    
    await query(
      `INSERT INTO users (id, email, name, password, google_id, avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, email, name, password, googleId || null, avatar || null]
    );
    
    return this.getById(id);
  }

  static async getById(id) {
    const result = await query(`SELECT * FROM users WHERE id = ?`, [id]);
    return result.rows?.[0] || null;
  }

  static async getByEmail(email) {
    const result = await query(`SELECT * FROM users WHERE email = ?`, [email]);
    return result.rows?.[0] || null;
  }

  static async getByGoogleId(googleId) {
    const result = await query(`SELECT * FROM users WHERE google_id = ?`, [googleId]);
    return result.rows?.[0] || null;
  }

  static async verifyPassword(user, password) {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  static async updateLastLogin(userId) {
    await query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [userId]);
  }
}

module.exports = UserModel;