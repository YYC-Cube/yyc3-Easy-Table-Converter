-- ============================================
-- YYC³ Easy Table Converter 用户认证数据表
-- 数据库: yyc3_33
-- 账号: yyc3_web / yyc3_web_2026
-- 创建时间: 2026-02-22
-- ============================================

-- 用户会话表
CREATE TABLE IF NOT EXISTS `sys_user_session` (
  `sid` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '会话ID',
  `userId` INT NOT NULL COMMENT '用户ID',
  `username` VARCHAR(32) NOT NULL COMMENT '用户名',
  `data` TEXT COMMENT '会话数据(JSON)',
  `expiresAt` BIGINT NOT NULL COMMENT '过期时间戳',
  `createTime` BIGINT NOT NULL COMMENT '创建时间戳',
  INDEX `idx_userId` (`userId`),
  INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会话表';

-- 转换任务历史表
CREATE TABLE IF NOT EXISTS `etc_conversion_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT COMMENT '用户ID',
  `task_id` VARCHAR(64) NOT NULL COMMENT '任务ID',
  `task_type` VARCHAR(32) NOT NULL COMMENT '任务类型',
  `input_format` VARCHAR(16) COMMENT '输入格式',
  `output_format` VARCHAR(16) COMMENT '输出格式',
  `input_filename` VARCHAR(255) COMMENT '输入文件名',
  `output_filename` VARCHAR(255) COMMENT '输出文件名',
  `file_size` BIGINT COMMENT '文件大小(字节)',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待处理, 1-处理中, 2-已完成, 3-失败',
  `progress` INT DEFAULT 0 COMMENT '进度百分比',
  `error_message` TEXT COMMENT '错误信息',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` VARCHAR(255) COMMENT '用户代理',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `complete_time` DATETIME COMMENT '完成时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='转换任务历史表';

-- 用户收藏表
CREATE TABLE IF NOT EXISTS `etc_user_favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `tool_id` VARCHAR(64) NOT NULL COMMENT '工具ID',
  `tool_type` VARCHAR(32) COMMENT '工具类型',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  UNIQUE KEY `uk_user_tool` (`user_id`, `tool_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏表';

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS `etc_user_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE COMMENT '用户ID',
  `theme` VARCHAR(16) DEFAULT 'light' COMMENT '主题: light/dark',
  `language` VARCHAR(8) DEFAULT 'zh-CN' COMMENT '语言',
  `timezone` VARCHAR(32) DEFAULT 'Asia/Shanghai' COMMENT '时区',
  `default_output_format` VARCHAR(16) COMMENT '默认输出格式',
  `auto_save` TINYINT DEFAULT 1 COMMENT '自动保存: 0-否, 1-是',
  `notification_enabled` TINYINT DEFAULT 1 COMMENT '通知启用: 0-否, 1-是',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好设置表';

-- 用户API密钥表
CREATE TABLE IF NOT EXISTS `etc_user_api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `key_name` VARCHAR(64) NOT NULL COMMENT '密钥名称',
  `api_key` VARCHAR(128) NOT NULL UNIQUE COMMENT 'API密钥',
  `api_secret` VARCHAR(128) NOT NULL COMMENT 'API密钥私钥',
  `permissions` TEXT COMMENT '权限列表(JSON)',
  `rate_limit` INT DEFAULT 100 COMMENT '速率限制(次/小时)',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用: 0-否, 1-是',
  `last_used_time` DATETIME COMMENT '最后使用时间',
  `expire_time` DATETIME COMMENT '过期时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户API密钥表';

-- 使用说明:
-- 1. 使用 yyc3_web 账号连接 yyc3_33 数据库
-- 2. 执行此SQL脚本创建所需的表
-- 3. 确保 sys_user 表已存在（来自 DATABASE_SUMMARY.md）
-- 4. 如需初始化数据，请参考 DATABASE_SUMMARY.md 中的用户配置
