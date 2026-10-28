-- ============================================================
-- RESUME BUILDER - MYSQL SCHEMA
-- ============================================================

-- ─── USERS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          CHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(30),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ─── DEVICES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  device_id         VARCHAR(255) PRIMARY KEY,
  plan              VARCHAR(20) DEFAULT 'free',
  ats_checks_used   INT DEFAULT 0,
  ats_checks_limit  INT DEFAULT 3,
  downloads_used    INT DEFAULT 0,
  downloads_limit   INT DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_devices_plan ON devices(plan);

-- ─── PAYMENTS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    CHAR(36) PRIMARY KEY,
  device_id             VARCHAR(255),
  razorpay_order_id     VARCHAR(100),
  razorpay_payment_id   VARCHAR(100),
  razorpay_signature   TEXT,
  amount               DECIMAL(10,2),
  plan_type            VARCHAR(20),
  status               VARCHAR(20) DEFAULT 'pending',
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_device ON payments(device_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- ─── RESUMES TABLE ───────────────────────────────────────────
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
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_session_id ON resumes(session_id);
CREATE INDEX idx_resumes_device_id ON resumes(device_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX idx_resumes_ats_score ON resumes(ats_score DESC);

-- ─── AI USAGE LOG TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id          CHAR(36) PRIMARY KEY,
  resume_id   CHAR(36),
  session_id  VARCHAR(255),
  feature     VARCHAR(100) NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_logs_resume_id ON ai_usage_logs(resume_id);
CREATE INDEX idx_ai_logs_created_at ON ai_usage_logs(created_at DESC);

-- ─── RESUME DOWNLOADS LOG ────────────────────────────────────
CREATE TABLE IF NOT EXISTS download_logs (
  id          CHAR(36) PRIMARY KEY,
  resume_id   CHAR(36),
  session_id  VARCHAR(255),
  format      VARCHAR(20) DEFAULT 'pdf',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_downloads_resume_id ON download_logs(resume_id);