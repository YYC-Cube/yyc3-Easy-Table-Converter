/**
 * @file 用户注册 API 路由
 * @description 处理用户注册请求
 * @module app/api/auth/register/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/database';
import bcrypt from 'bcryptjs';

interface RegisterBody {
  username: string;
  password: string;
  email?: string;
  real_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json();
    const { username, password, email, real_name } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码为必填项' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    const existingUsers = await query<{ id: number }[]>(
      'SELECT id FROM sys_user WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 409 }
      );
    }

    if (email) {
      const existingEmails = await query<{ id: number }[]>(
        'SELECT id FROM sys_user WHERE email = ?',
        [email]
      );

      if (existingEmails.length > 0) {
        return NextResponse.json(
          { success: false, message: '邮箱已被注册' },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCode = `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await query(
      `INSERT INTO sys_user (user_code, username, password, email, real_name, status, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [userCode, username, hashedPassword, email || null, real_name || null]
    );

    return NextResponse.json({
      success: true,
      message: '注册成功，请登录'
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
