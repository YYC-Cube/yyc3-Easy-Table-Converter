/**
 * @file 用户任务历史 API 路由
 * @description 处理用户任务历史的查询和管理请求
 * @module app/api/user/history/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth/authService';
import taskHistoryService from '@/lib/services/taskHistoryService';

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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status');
    const taskType = searchParams.get('taskType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const result = await taskHistoryService.query({
      userId: session.userId,
      status: status ? parseInt(status, 10) : undefined,
      taskType: taskType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize
    });
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get History Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    
    const session = await authService.verifySession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: '会话已过期' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json({ success: false, message: '缺少任务ID' }, { status: 400 });
    }
    
    await taskHistoryService.delete(taskId);
    
    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete History Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
