USE yyc3_web;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin', 'vip') DEFAULT 'user',
  status TINYINT(1) DEFAULT 1,
  email_verified TINYINT(1) DEFAULT 0,
  last_login_at DATETIME DEFAULT NULL,
  last_login_ip VARCHAR(45) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS error_logs (
  id INT NOT NULL AUTO_INCREMENT,
  message VARCHAR(500) NOT NULL,
  code VARCHAR(50) DEFAULT NULL,
  stack TEXT DEFAULT NULL,
  level ENUM('error', 'warn', 'info') DEFAULT 'error',
  user_id INT DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  url VARCHAR(500) DEFAULT NULL,
  method VARCHAR(10) DEFAULT NULL,
  status_code INT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  extra_data JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_level (level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversion_tasks (
  id INT NOT NULL AUTO_INCREMENT,
  task_id VARCHAR(100) NOT NULL,
  user_id INT DEFAULT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT DEFAULT NULL,
  source_format VARCHAR(20) NOT NULL,
  target_format VARCHAR(20) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  progress INT DEFAULT 0,
  input_path VARCHAR(500) DEFAULT NULL,
  output_path VARCHAR(500) DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  options JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_retry_logs (
  id INT NOT NULL AUTO_INCREMENT,
  task_id VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) DEFAULT NULL,
  attempt_number INT NOT NULL,
  error_message TEXT DEFAULT NULL,
  duration INT DEFAULT NULL,
  success TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_task_id (task_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  session_token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supported_formats (
  id INT NOT NULL AUTO_INCREMENT,
  format VARCHAR(20) NOT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  extension VARCHAR(20) DEFAULT NULL,
  category ENUM('spreadsheet', 'document', 'data', 'image', 'other') DEFAULT 'other',
  is_input TINYINT(1) DEFAULT 1,
  is_output TINYINT(1) DEFAULT 1,
  description VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_format (format)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO supported_formats (format, mime_type, extension, category, is_input, is_output, description) VALUES
('excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx', 'spreadsheet', 1, 1, 'Microsoft Excel'),
('csv', 'text/csv', 'csv', 'data', 1, 1, 'Comma Separated Values'),
('json', 'application/json', 'json', 'data', 1, 1, 'JavaScript Object Notation'),
('xml', 'application/xml', 'xml', 'data', 1, 1, 'Extensible Markup Language'),
('markdown', 'text/markdown', 'md', 'document', 1, 1, 'Markdown'),
('html', 'text/html', 'html', 'document', 1, 1, 'HyperText Markup Language'),
('sql', 'application/sql', 'sql', 'data', 1, 1, 'Structured Query Language'),
('txt', 'text/plain', 'txt', 'document', 1, 1, 'Plain Text');

SHOW TABLES;
