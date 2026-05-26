/**
 * @file 头像上传 API 路由
 * @description 处理用户头像上传、生成多规格图片
 * @module app/api/user/avatar/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { avatarService } from '@/lib/services/avatarService';
import { query } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '无效的用户ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;
    const action = formData.get('action') as string;

    if (action === 'generate-initials') {
      const name = formData.get('name') as string || session.user.name || 'User';
      const bgColor = formData.get('backgroundColor') as string | undefined;
      
      const result = await avatarService.generateInitialsAvatar(name, userId, { backgroundColor: bgColor });
      
      await query(
        'UPDATE sys_user SET avatar = ? WHERE id = ?',
        [result.urls.medium, userId]
      );
      
      return NextResponse.json({
        success: true,
        message: '头像生成成功',
        urls: result.urls
      });
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: '请选择头像文件' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '不支持的图片格式' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: '图片大小不能超过5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const format = file.type === 'image/png' ? 'png' : 
                   file.type === 'image/webp' ? 'webp' : 'jpg';
    
    const result = await avatarService.processAvatar(buffer, userId, { format });
    
    await query(
      'UPDATE sys_user SET avatar = ? WHERE id = ?',
      [result.urls.medium, userId]
    );

    return NextResponse.json({
      success: true,
      message: '头像上传成功',
      urls: result.urls,
      original: result.original
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    
    await avatarService.deleteAvatar(userId);
    
    await query(
      'UPDATE sys_user SET avatar = NULL WHERE id = ?',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: '头像删除成功'
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
