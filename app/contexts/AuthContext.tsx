/**
 * @file 用户认证上下文
 * @description 提供用户认证状态管理的 React Context
 * @module contexts/AuthContext
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  user_code: string;
  username: string;
  real_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role_id?: number;
  last_login_time?: string;
  create_time?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  register: (data: { username: string; password: string; email?: string; real_name?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setPermissions(data.permissions || []);
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    username: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', username, password, rememberMe })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        return { success: true, message: '登录成功' };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    email?: string;
    real_name?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'register', ...data })
      });
      
      const result = await response.json();
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: '注册失败，请稍后重试' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPermissions([]);
    }
  };

  const changePassword = async (
    oldPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'changePassword', oldPassword, newPassword })
      });
      
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: '修改密码失败，请稍后重试' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    permissions,
    login,
    register,
    logout,
    refreshUser,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
