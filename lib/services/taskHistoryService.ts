/**
 * @file 任务历史服务
 * @description 转换任务历史的数据库持久化服务
 * @module lib/services/taskHistoryService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { query } from '../db/database';

export interface ConversionHistory {
  id?: number;
  user_id?: number;
  task_id: string;
  task_type: string;
  input_format?: string;
  output_format?: string;
  input_filename?: string;
  output_filename?: string;
  file_size?: number;
  status: 0 | 1 | 2 | 3;
  progress: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  create_time?: Date;
  update_time?: Date;
  complete_time?: Date;
}

export interface TaskHistoryQuery {
  userId?: number;
  status?: number;
  taskType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface TaskHistoryResult {
  total: number;
  list: ConversionHistory[];
  page: number;
  pageSize: number;
}

class TaskHistoryService {
  /**
   * 创建任务记录
   */
  async create(history: ConversionHistory): Promise<number> {
    const result = await query<{ insertId: number }>(
      `INSERT INTO etc_conversion_history 
       (user_id, task_id, task_type, input_format, output_format, input_filename, 
        output_filename, file_size, status, progress, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        history.user_id || null,
        history.task_id,
        history.task_type,
        history.input_format || null,
        history.output_format || null,
        history.input_filename || null,
        history.output_filename || null,
        history.file_size || null,
        history.status,
        history.progress,
        history.ip_address || null,
        history.user_agent || null
      ]
    );
    return result.insertId;
  }

  /**
   * 更新任务状态
   */
  async updateStatus(
    taskId: string,
    status: 0 | 1 | 2 | 3,
    progress: number = 0,
    errorMessage?: string
  ): Promise<boolean> {
    const completeTime = status === 2 || status === 3 ? 'NOW()' : 'NULL';
    
    await query(
      `UPDATE etc_conversion_history 
       SET status = ?, progress = ?, error_message = ?, 
           update_time = NOW(), complete_time = ${completeTime}
       WHERE task_id = ?`,
      [status, progress, errorMessage || null, taskId]
    );
    
    return true;
  }

  /**
   * 更新任务进度
   */
  async updateProgress(taskId: string, progress: number): Promise<boolean> {
    await query(
      'UPDATE etc_conversion_history SET progress = ?, update_time = NOW() WHERE task_id = ?',
      [progress, taskId]
    );
    return true;
  }

  /**
   * 更新任务结果
   */
  async updateResult(
    taskId: string,
    outputFilename: string,
    fileSize: number
  ): Promise<boolean> {
    await query(
      `UPDATE etc_conversion_history 
       SET output_filename = ?, file_size = ?, status = 2, progress = 100,
           update_time = NOW(), complete_time = NOW()
       WHERE task_id = ?`,
      [outputFilename, fileSize, taskId]
    );
    return true;
  }

  /**
   * 查询任务详情
   */
  async getById(taskId: string): Promise<ConversionHistory | null> {
    const results = await query<ConversionHistory[]>(
      'SELECT * FROM etc_conversion_history WHERE task_id = ?',
      [taskId]
    );
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 分页查询任务历史
   */
  async query(params: TaskHistoryQuery): Promise<TaskHistoryResult> {
    const { userId, status, taskType, startDate, endDate, page = 1, pageSize = 20 } = params;
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (userId !== undefined) {
      conditions.push('user_id = ?');
      values.push(userId);
    }
    if (status !== undefined) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (taskType) {
      conditions.push('task_type = ?');
      values.push(taskType);
    }
    if (startDate) {
      conditions.push('create_time >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('create_time <= ?');
      values.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;
    
    const countResult = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM etc_conversion_history ${whereClause}`,
      values
    );
    
    const list = await query<ConversionHistory[]>(
      `SELECT * FROM etc_conversion_history ${whereClause} 
       ORDER BY create_time DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );
    
    return {
      total: countResult[0].count,
      list,
      page,
      pageSize
    };
  }

  /**
   * 获取用户任务统计
   */
  async getUserStats(userId: number): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
  }> {
    const stats = await query<{ total: number; completed: number; failed: number; processing: number }[]>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as failed,
         SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as processing
       FROM etc_conversion_history WHERE user_id = ?`,
      [userId]
    );
    
    return stats[0] || { total: 0, completed: 0, failed: 0, processing: 0 };
  }

  /**
   * 删除任务记录
   */
  async delete(taskId: string): Promise<boolean> {
    await query('DELETE FROM etc_conversion_history WHERE task_id = ?', [taskId]);
    return true;
  }

  /**
   * 清理过期任务记录
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    const result = await query<{ affectedRows: number }>(
      `DELETE FROM etc_conversion_history 
       WHERE status IN (2, 3) AND create_time < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysOld]
    );
    return result.affectedRows;
  }
}

export const taskHistoryService = new TaskHistoryService();
export default taskHistoryService;
