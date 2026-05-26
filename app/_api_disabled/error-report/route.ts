/**
 * @file 错误日志收集 API
 * @description 接收并存储前端错误报告
 * @module app/api/error-report/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/database';

interface ErrorReport {
  message: string;
  code?: string;
  stack?: string;
  details?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: number;
  level: 'error' | 'warn' | 'info';
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorReport = await request.json();
    
    const {
      message,
      code,
      stack,
      details,
      timestamp,
      userAgent,
      url,
      userId,
      level
    } = body;

    await query(
      `INSERT INTO etc_error_logs 
       (error_message, error_code, stack_trace, error_details, log_level, user_id, user_agent, request_url, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message,
        code || null,
        stack || null,
        details ? JSON.stringify(details) : null,
        level || 'error',
        userId || null,
        userAgent || null,
        url || null,
        timestamp ? new Date(timestamp) : new Date()
      ]
    );

    return NextResponse.json({
      success: true,
      message: '错误报告已接收'
    });
  } catch (error) {
    console.error('Error report error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const level = searchParams.get('level');
    const userId = searchParams.get('userId');
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (level) {
      conditions.push('log_level = ?');
      values.push(level);
    }
    if (userId) {
      conditions.push('user_id = ?');
      values.push(parseInt(userId, 10));
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;
    
    const countResult = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM etc_error_logs ${whereClause}`,
      values
    );
    
    const logs = await query<any[]>(
      `SELECT * FROM etc_error_logs ${whereClause} 
       ORDER BY create_time DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );
    
    return NextResponse.json({
      success: true,
      total: countResult[0].count,
      page,
      pageSize,
      logs
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30', 10);
    
    const result = await query<{ affectedRows: number }>(
      `DELETE FROM etc_error_logs 
       WHERE create_time < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysOld]
    );
    
    return NextResponse.json({
      success: true,
      deleted: result.affectedRows
    });
  } catch (error) {
    console.error('Delete error logs error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
