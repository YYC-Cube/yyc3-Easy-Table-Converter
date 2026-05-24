/**
 * @file 用户收藏 API 路由
 * @description 处理用户收藏工具的请求
 * @module app/api/user/favorites/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth/authService';
import userPreferencesService from '@/lib/services/userPreferencesService';

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
    
    const favorites = await userPreferencesService.getFavorites(session.userId);
    
    return NextResponse.json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error('Get Favorites Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    
    const session = await authService.verifySession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: '会话已过期' }, { status: 401 });
    }
    
    const { toolId, toolType, action } = await request.json();
    
    if (action === 'add') {
      const result = await userPreferencesService.addFavorite(session.userId, toolId, toolType);
      return NextResponse.json({
        success: result,
        message: result ? '收藏成功' : '已收藏'
      });
    } else if (action === 'remove') {
      await userPreferencesService.removeFavorite(session.userId, toolId);
      return NextResponse.json({
        success: true,
        message: '取消收藏成功'
      });
    } else if (action === 'check') {
      const isFavorited = await userPreferencesService.isFavorited(session.userId, toolId);
      return NextResponse.json({
        success: true,
        isFavorited
      });
    }
    
    return NextResponse.json({ success: false, message: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('Favorites API Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
