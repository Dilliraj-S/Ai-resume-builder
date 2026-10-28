const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_DATABASE || 'resumedb',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 30000,
  queueLimit: 0,
});

pool.on('connection', () => {
  logger.info('New MySQL client connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected MySQL pool error:', err);
});

const connectDB = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info(`MySQL connected to database: ${process.env.DB_DATABASE}`);
  } finally {
    connection.release();
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    let result;
    if (params && params.length > 0) {
      result = await pool.query(text, params);
    } else {
      result = await pool.query(text);
    }
    const duration = Date.now() - start;
    if (duration > 200) {
      logger.warn(`Slow query detected: ${duration}ms`, { query: text });
    }
    
    // mysql2 returns [rows, fields] for SELECT, [OkPacket, fields] for UPDATE/INSERT
    // Check if it's an OkPacket (has affectedRows property)
    if (Array.isArray(result) && result[0]?.affectedRows !== undefined) {
      return { okPacket: result[0] }; // Return OkPacket for UPDATE/INSERT
    }
    
    // Return rows for SELECT queries
    const rows = Array.isArray(result) ? result[0] : result.rows || [];
    return { rows };
  } catch (error) {
    logger.error('Database query error:', { query: text, error: error.message });
    throw error;
  }
};

const getConnection = () => pool.getConnection();

module.exports = { pool, connectDB, query, getConnection };