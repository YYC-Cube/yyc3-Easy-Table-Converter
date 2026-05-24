/**
 * @file 用户认证服务
 * @description 用户登录、注册、会话管理等认证功能
 * @module lib/auth/authService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { query, pool } from '../db/database';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  UserSession,
  TokenPayload,
  SessionStore
} from '../types/auth';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'yyc3_jwt_secret_key_2026_dev';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

class AuthService {
  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { username, password } = credentials;
    
    const hashedPassword = this.hashPassword(password);
    
    const users = await query<User[]>(
      'SELECT * FROM sys_user WHERE username = ? AND password = ? AND status = 1',
      [username, hashedPassword]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        message: '用户名或密码错误'
      };
    }
    
    const user = users[0];
    
    await this.updateLastLoginTime(user.id);
    
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role_id?.toString()
    });
    
    const sessionId = await this.createSession(user);
    
    return {
      success: true,
      message: '登录成功',
      user: this.sanitizeUser(user),
      token,
      refreshToken: sessionId
    };
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { username, password, email, phone, real_name } = data;
    
    const existingUsers = await query<User[]>(
      'SELECT id FROM sys_user WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return {
        success: false,
        message: '用户名已存在'
      };
    }
    
    if (email) {
      const emailUsers = await query<User[]>(
        'SELECT id FROM sys_user WHERE email = ?',
        [email]
      );
      if (emailUsers.length > 0) {
        return {
          success: false,
          message: '邮箱已被注册'
        };
      }
    }
    
    const hashedPassword = this.hashPassword(password);
    const userCode = this.generateUserCode();
    
    const result = await query<{ insertId: number }>(
      `INSERT INTO sys_user (user_code, username, password, real_name, email, phone, status, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [userCode, username, hashedPassword, real_name || null, email || null, phone || null]
    );
    
    const newUser: User = {
      id: result.insertId,
      user_code: userCode,
      username,
      real_name: real_name,
      email,
      phone,
      status: 1,
      create_time: new Date(),
      update_time: new Date()
    };
    
    return {
      success: true,
      message: '注册成功',
      user: this.sanitizeUser(newUser)
    };
  }

  /**
   * 用户登出
   */
  async logout(sessionId: string): Promise<boolean> {
    await query('DELETE FROM sys_user_session WHERE sid = ?', [sessionId]);
    return true;
  }

  /**
   * 验证会话
   */
  async verifySession(sessionId: string): Promise<UserSession | null> {
    const sessions = await query<SessionStore[]>(
      'SELECT * FROM sys_user_session WHERE sid = ? AND expiresAt > ?',
      [sessionId, Date.now()]
    );
    
    if (sessions.length === 0) {
      return null;
    }
    
    const session = sessions[0];
    const users = await query<User[]>(
      'SELECT * FROM sys_user WHERE id = ?',
      [session.userId]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    
    return {
      userId: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role_id?.toString(),
      permissions: await this.getUserPermissions(user.role_id || 0),
      expiresAt: new Date(session.expiresAt)
    };
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: number): Promise<User | null> {
    const users = await query<User[]>(
      'SELECT * FROM sys_user WHERE id = ?',
      [userId]
    );
    
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: number, data: Partial<User>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.real_name !== undefined) {
      fields.push('real_name = ?');
      values.push(data.real_name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(data.avatar);
    }
    
    if (fields.length === 0) {
      return false;
    }
    
    fields.push('update_time = NOW()');
    values.push(userId);
    
    await query(
      `UPDATE sys_user SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return true;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<AuthResponse> {
    const hashedOldPassword = this.hashPassword(oldPassword);
    
    const users = await query<User[]>(
      'SELECT id FROM sys_user WHERE id = ? AND password = ?',
      [userId, hashedOldPassword]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        message: '原密码错误'
      };
    }
    
    const hashedNewPassword = this.hashPassword(newPassword);
    await query(
      'UPDATE sys_user SET password = ?, update_time = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    return {
      success: true,
      message: '密码修改成功'
    };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const session = await this.verifySession(refreshToken);
    
    if (!session) {
      return {
        success: false,
        message: '会话已过期，请重新登录'
      };
    }
    
    const user = await this.getCurrentUser(session.userId);
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role_id?.toString()
    });
    
    return {
      success: true,
      message: 'Token 刷新成功',
      user: this.sanitizeUser(user),
      token
    };
  }

  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + 'yyc3_salt_2026')
      .digest('hex');
  }

  private generateUserCode(): string {
    return 'USR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  private generateToken(payload: { userId: number; username: string; role?: string }): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 60 * 60;
    
    const tokenPayload = Buffer.from(
      JSON.stringify({ ...payload, iat: now, exp })
    ).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${tokenPayload}`)
      .digest('base64url');
    
    return `${header}.${tokenPayload}.${signature}`;
  }

  private async createSession(user: User): Promise<string> {
    const sid = crypto.randomUUID();
    const expiresAt = Date.now() + SESSION_MAX_AGE;
    
    await query(
      `INSERT INTO sys_user_session (sid, userId, username, data, expiresAt, createTime)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sid, user.id, user.username, JSON.stringify({}), expiresAt, Date.now()]
    );
    
    return sid;
  }

  private async updateLastLoginTime(userId: number): Promise<void> {
    await query(
      'UPDATE sys_user SET last_login_time = NOW() WHERE id = ?',
      [userId]
    );
  }

  private async getUserPermissions(roleId: number): Promise<string[]> {
    if (!roleId) return [];
    
    const permissions = await query<{ permission_code: string }[]>(
      `SELECT p.permission_code 
       FROM manage_permission p
       JOIN manage_role_permission rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    
    return permissions.map(p => p.permission_code);
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();
export default authService;
