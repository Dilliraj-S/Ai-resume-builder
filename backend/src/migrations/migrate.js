const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const fs = require('fs');
const { pool } = require('../config/database');

const migrate = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Running database migrations...');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE || 'resumedb'}`);
    console.log('✅ Database ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          CHAR(36) PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        phone       VARCHAR(30),
        password    VARCHAR(255),
        google_id   VARCHAR(255) UNIQUE,
        avatar      TEXT,
        last_login  TIMESTAMP NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Add missing columns if table already existed
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`).catch(() => {});
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`).catch(() => {});
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`).catch(() => {});
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id         VARCHAR(255) PRIMARY KEY,
        user_id         CHAR(36) NULL,
        plan              VARCHAR(20) DEFAULT 'free',
        ai_credits       INT DEFAULT 5,
        total_credits    INT DEFAULT 5,
        ats_checks_used   INT DEFAULT 0,
        ats_checks_limit  INT DEFAULT 3,
        downloads_used    INT DEFAULT 0,
        downloads_limit   INT DEFAULT 0,
        expires_at      TIMESTAMP NULL DEFAULT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Devices table ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id                    CHAR(36) PRIMARY KEY,
        device_id             VARCHAR(255),
        razorpay_order_id     VARCHAR(100),
        razorpay_payment_id   VARCHAR(100) UNIQUE,
        razorpay_signature   TEXT,
        amount               DECIMAL(10,2),
        plan_type            VARCHAR(20),
        status               VARCHAR(20) DEFAULT 'pending',
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Payments table ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id              CHAR(36) PRIMARY KEY,
        user_id         CHAR(36),
        session_id      VARCHAR(255),
        device_id       VARCHAR(255),
        title           VARCHAR(255) DEFAULT 'My Resume',
        template_id     VARCHAR(100) DEFAULT 'modern-1',
        resume_data     JSON,
        ats_score       INT DEFAULT 0,
        ats_feedback    JSON DEFAULT ('[]'),
        is_published    BOOLEAN DEFAULT FALSE,
        download_count  INT DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Resumes table ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id          CHAR(36) PRIMARY KEY,
        resume_id   CHAR(36),
        session_id  VARCHAR(255),
        device_id  VARCHAR(255),
        feature     VARCHAR(100) NOT NULL,
        tokens_used INT DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ AI usage logs table ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS download_logs (
        id          CHAR(36) PRIMARY KEY,
        resume_id   CHAR(36),
        session_id  VARCHAR(255),
        device_id   VARCHAR(255),
        format      VARCHAR(20) DEFAULT 'pdf',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Download logs table ready');

    // Create indexes (use IF NOT EXISTS for MySQL 8.0+)
    await connection.query(`CREATE INDEX idx_users_email ON users(email)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_devices_plan ON devices(plan)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_payments_device ON payments(device_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_payments_status ON payments(status)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_payments_created ON payments(created_at DESC)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_payments_razorpay_payment ON payments(razorpay_payment_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_payments_order_id ON payments(razorpay_order_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_resumes_user_id ON resumes(user_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_resumes_session_id ON resumes(session_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_resumes_device_id ON resumes(device_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_resumes_ats_score ON resumes(ats_score DESC)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_devices_plan ON devices(plan)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_devices_expires_at ON devices(expires_at)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_ai_logs_resume_id ON ai_usage_logs(resume_id)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_ai_logs_created_at ON ai_usage_logs(created_at DESC)`).catch(() => {});
    await connection.query(`CREATE INDEX idx_downloads_resume_id ON download_logs(resume_id)`).catch(() => {});
    console.log('✅ Indexes ready');

    console.log('');
    console.log('🎉 All migrations completed successfully!');
    console.log('📊 Tables: users, devices, payments, resumes, ai_usage_logs, download_logs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
};

migrate();