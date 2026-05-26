/**
 * @file 用户认证 API 路由
 * @description 处理用户登录、注册、登出等认证请求
 * @module app/api/auth/[...route]
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'login': {
        const { username, password, rememberMe } = body;
        const result = await authService.login({ username, password, rememberMe });
        const response = NextResponse.json(result);
        
        if (result.success && result.refreshToken) {
          response.cookies.set('auth_token', result.token || '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
            path: '/'
          });
          
          response.cookies.set('session_id', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
            path: '/'
          });
        }
        
        return response;
      }

      case 'register': {
        const { username, password, email, phone, real_name } = body;
        const result = await authService.register({ username, password, email, phone, real_name });
        return NextResponse.json(result);
      }

      case 'logout': {
        const sessionId = request.cookies.get('session_id')?.value;
        if (sessionId) {
          await authService.logout(sessionId);
        }
        
        const response = NextResponse.json({ success: true, message: '登出成功' });
        response.cookies.delete('auth_token');
        response.cookies.delete('session_id');
        return response;
      }

      case 'refresh': {
        const sessionId = request.cookies.get('session_id')?.value;
        if (!sessionId) {
          return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
        }
        
        const result = await authService.refreshToken(sessionId);
        
        if (result.success && result.token) {
          const response = NextResponse.json(result);
          response.cookies.set('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/'
          });
          return response;
        }
        
        return NextResponse.json(result, { status: 401 });
      }

      case 'changePassword': {
        const sessionId = request.cookies.get('session_id')?.value;
        if (!sessionId) {
          return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
        }
        
        const session = await authService.verifySession(sessionId);
        if (!session) {
          return NextResponse.json({ success: false, message: '会话已过期' }, { status: 401 });
        }
        
        const { oldPassword, newPassword } = body;
        const result = await authService.changePassword(session.userId, oldPassword, newPassword);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, message: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    
    const session = await authService.verifySession(sessionId);
    
    if (!session) {
      return NextResponse.json({ success: false, message: '会话已过期' }, { status: 401 });
    }
    
    const user = await authService.getCurrentUser(session.userId);
    
    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        user_code: user.user_code,
        username: user.username,
        real_name: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role_id: user.role_id,
        last_login_time: user.last_login_time,
        create_time: user.create_time
      },
      permissions: session.permissions
    });
  } catch (error) {
    console.error('Get Current User Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
