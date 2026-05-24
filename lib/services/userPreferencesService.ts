/**
 * @file 用户收藏与偏好服务
 * @description 用户收藏工具和偏好设置的数据库持久化服务
 * @module lib/services/userPreferencesService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { query } from '../db/database';

export interface UserFavorite {
  id?: number;
  user_id: number;
  tool_id: string;
  tool_type?: string;
  create_time?: Date;
}

export interface UserPreferences {
  id?: number;
  user_id: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  default_output_format?: string;
  auto_save: boolean;
  notification_enabled: boolean;
  create_time?: Date;
  update_time?: Date;
}

class UserPreferencesService {
  /**
   * 获取用户收藏列表
   */
  async getFavorites(userId: number): Promise<UserFavorite[]> {
    return await query<UserFavorite[]>(
      'SELECT * FROM etc_user_favorites WHERE user_id = ? ORDER BY create_time DESC',
      [userId]
    );
  }

  /**
   * 添加收藏
   */
  async addFavorite(userId: number, toolId: string, toolType?: string): Promise<boolean> {
    try {
      await query(
        'INSERT INTO etc_user_favorites (user_id, tool_id, tool_type) VALUES (?, ?, ?)',
        [userId, toolId, toolType || null]
      );
      return true;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 移除收藏
   */
  async removeFavorite(userId: number, toolId: string): Promise<boolean> {
    await query(
      'DELETE FROM etc_user_favorites WHERE user_id = ? AND tool_id = ?',
      [userId, toolId]
    );
    return true;
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: number, toolId: string): Promise<boolean> {
    const results = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM etc_user_favorites WHERE user_id = ? AND tool_id = ?',
      [userId, toolId]
    );
    return results[0].count > 0;
  }

  /**
   * 获取用户偏好设置
   */
  async getPreferences(userId: number): Promise<UserPreferences | null> {
    const results = await query<UserPreferences[]>(
      'SELECT * FROM etc_user_preferences WHERE user_id = ?',
      [userId]
    );
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 创建用户偏好设置
   */
  async createPreferences(userId: number): Promise<boolean> {
    try {
      await query(
        `INSERT INTO etc_user_preferences (user_id, theme, language, timezone, auto_save, notification_enabled)
         VALUES (?, 'light', 'zh-CN', 'Asia/Shanghai', 1, 1)`,
        [userId]
      );
      return true;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 更新用户偏好设置
   */
  async updatePreferences(userId: number, preferences: Partial<UserPreferences>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (preferences.theme !== undefined) {
      fields.push('theme = ?');
      values.push(preferences.theme);
    }
    if (preferences.language !== undefined) {
      fields.push('language = ?');
      values.push(preferences.language);
    }
    if (preferences.timezone !== undefined) {
      fields.push('timezone = ?');
      values.push(preferences.timezone);
    }
    if (preferences.default_output_format !== undefined) {
      fields.push('default_output_format = ?');
      values.push(preferences.default_output_format);
    }
    if (preferences.auto_save !== undefined) {
      fields.push('auto_save = ?');
      values.push(preferences.auto_save ? 1 : 0);
    }
    if (preferences.notification_enabled !== undefined) {
      fields.push('notification_enabled = ?');
      values.push(preferences.notification_enabled ? 1 : 0);
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('update_time = NOW()');
    values.push(userId);

    await query(
      `UPDATE etc_user_preferences SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return true;
  }

  /**
   * 确保用户偏好设置存在
   */
  async ensurePreferences(userId: number): Promise<UserPreferences> {
    let preferences = await this.getPreferences(userId);
    if (!preferences) {
      await this.createPreferences(userId);
      preferences = await this.getPreferences(userId);
    }
    return preferences!;
  }
}

export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;
