/**
 * @file 用户认证类型定义
 * @description 用户认证相关接口和类型定义
 * @module lib/types/auth
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

export interface User {
  id: number;
  user_code: string;
  username: string;
  real_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: 0 | 1;
  role_id?: number;
  last_login_time?: Date;
  create_time: Date;
  update_time: Date;
}

export interface UserSession {
  userId: number;
  username: string;
  realName?: string;
  role?: string;
  permissions: string[];
  expiresAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  real_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
  role?: string;
  iat: number;
  exp: number;
}

export interface SessionStore {
  sid: string;
  userId: number;
  username: string;
  data: Record<string, any>;
  expiresAt: number;
  createTime: number;
}
