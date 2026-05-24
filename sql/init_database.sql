-- =============================================
-- YYC³ Easy Table Converter 数据库初始化脚本
-- 创建日期: 2026-02-22
-- 数据库: yyc3_web
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 用户表
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `role` ENUM('user', 'admin', 'vip') DEFAULT 'user' COMMENT '用户角色',
  `status` TINYINT(1) DEFAULT 1 COMMENT '账户状态: 0-禁用, 1-正常',
  `email_verified` TINYINT(1) DEFAULT 0 COMMENT '邮箱是否验证',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 错误日志表
-- ----------------------------
DROP TABLE IF EXISTS `error_logs`;
CREATE TABLE `error_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `message` VARCHAR(500) NOT NULL COMMENT '错误信息',
  `code` VARCHAR(50) DEFAULT NULL COMMENT '错误代码',
  `stack` TEXT DEFAULT NULL COMMENT '堆栈跟踪',
  `level` ENUM('error', 'warn', 'info') DEFAULT 'error' COMMENT '日志级别',
  `user_id` INT DEFAULT NULL COMMENT '用户ID',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `url` VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
  `method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
  `status_code` INT DEFAULT NULL COMMENT 'HTTP状态码',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `extra_data` JSON DEFAULT NULL COMMENT '额外数据',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_level` (`level`),
  INDEX `idx_code` (`code`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_url` (`url`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错误日志表';

-- ----------------------------
-- 转换任务表
-- ----------------------------
DROP TABLE IF EXISTS `conversion_tasks`;
CREATE TABLE `conversion_tasks` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_id` VARCHAR(100) NOT NULL COMMENT '任务唯一标识',
  `user_id` INT DEFAULT NULL COMMENT '用户ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_size` BIGINT DEFAULT NULL COMMENT '文件大小(字节)',
  `source_format` VARCHAR(20) NOT NULL COMMENT '源格式',
  `target_format` VARCHAR(20) NOT NULL COMMENT '目标格式',
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
  `progress` INT DEFAULT 0 COMMENT '进度百分比',
  `input_path` VARCHAR(500) DEFAULT NULL COMMENT '输入文件路径',
  `output_path` VARCHAR(500) DEFAULT NULL COMMENT '输出文件路径',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `options` JSON DEFAULT NULL COMMENT '转换选项',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_id` (`task_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_completed_at` (`completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转换任务表';

-- ----------------------------
-- 任务重试记录表
-- ----------------------------
DROP TABLE IF EXISTS `task_retry_logs`;
CREATE TABLE `task_retry_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `task_id` VARCHAR(100) NOT NULL COMMENT '任务ID',
  `task_type` VARCHAR(50) DEFAULT NULL COMMENT '任务类型',
  `attempt_number` INT NOT NULL COMMENT '重试次数',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `duration` INT DEFAULT NULL COMMENT '执行时长(毫秒)',
  `success` TINYINT(1) DEFAULT 0 COMMENT '是否成功',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_task_type` (`task_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务重试记录表';

-- ----------------------------
-- 用户会话表
-- ----------------------------
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` VARCHAR(100) NOT NULL COMMENT '会话ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `session_token` VARCHAR(500) NOT NULL COMMENT '会话令牌',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- ----------------------------
-- 转换格式支持表
-- ----------------------------
DROP TABLE IF EXISTS `supported_formats`;
CREATE TABLE `supported_formats` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '格式ID',
  `format` VARCHAR(20) NOT NULL COMMENT '格式名称',
  `mime_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
  `extension` VARCHAR(20) DEFAULT NULL COMMENT '文件扩展名',
  `category` ENUM('spreadsheet', 'document', 'data', 'image', 'other') DEFAULT 'other' COMMENT '格式分类',
  `is_input` TINYINT(1) DEFAULT 1 COMMENT '是否支持输入',
  `is_output` TINYINT(1) DEFAULT 1 COMMENT '是否支持输出',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '格式描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_format` (`format`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支持的转换格式表';

-- ----------------------------
-- 插入默认支持的格式
-- ----------------------------
INSERT INTO `supported_formats` (`format`, `mime_type`, `extension`, `category`, `is_input`, `is_output`, `description`) VALUES
('excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx', 'spreadsheet', 1, 1, 'Microsoft Excel'),
('csv', 'text/csv', 'csv', 'data', 1, 1, 'Comma Separated Values'),
('json', 'application/json', 'json', 'data', 1, 1, 'JavaScript Object Notation'),
('xml', 'application/xml', 'xml', 'data', 1, 1, 'Extensible Markup Language'),
('markdown', 'text/markdown', 'md', 'document', 1, 1, 'Markdown'),
('html', 'text/html', 'html', 'document', 1, 1, 'HyperText Markup Language'),
('sql', 'application/sql', 'sql', 'data', 1, 1, 'Structured Query Language'),
('txt', 'text/plain', 'txt', 'document', 1, 1, 'Plain Text');

SET FOREIGN_KEY_CHECKS = 1;
