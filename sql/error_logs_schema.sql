-- 错误日志表
CREATE TABLE IF NOT EXISTS `etc_error_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `error_message` VARCHAR(500) NOT NULL COMMENT '错误信息',
  `error_code` VARCHAR(50) DEFAULT NULL COMMENT '错误代码',
  `stack_trace` TEXT DEFAULT NULL COMMENT '堆栈跟踪',
  `error_details` JSON DEFAULT NULL COMMENT '错误详情',
  `log_level` ENUM('error', 'warn', 'info') DEFAULT 'error' COMMENT '日志级别',
  `user_id` INT DEFAULT NULL COMMENT '用户ID',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `request_url` VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_log_level` (`log_level`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错误日志表';

-- 任务重试记录表
CREATE TABLE IF NOT EXISTS `etc_task_retry_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `task_id` VARCHAR(100) NOT NULL COMMENT '任务ID',
  `task_type` VARCHAR(50) DEFAULT NULL COMMENT '任务类型',
  `attempt_number` INT NOT NULL COMMENT '重试次数',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `duration` INT DEFAULT NULL COMMENT '执行时长(毫秒)',
  `success` TINYINT(1) DEFAULT 0 COMMENT '是否成功',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_task_type` (`task_type`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务重试记录表';
