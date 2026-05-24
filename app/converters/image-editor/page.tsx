'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageEditorProvider } from '@/components/image-editor/ImageEditorContext';
import { CanvasEditor } from '@/components/image-editor/CanvasEditor';
import { Toolbar } from '@/components/image-editor/Toolbar';
import { FileHandler } from '@/components/image-editor/FileHandler';

/**
 * @file 图片编辑器页面
 * @description 提供图片编辑功能，包括去水印、去文字、橡皮擦、裁剪等
 * @author YYC
 * @created 2024-10-15
 * @updated 2024-10-15 - 组件化重构
 */
export default function ImageEditor() {
  return (
    <ImageEditorProvider>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">图片编辑器</h1>
          <p className="text-gray-600">强大的图片编辑工具，支持去水印、裁剪、添加文字等功能</p>
        </header>
        
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>编辑画布</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {/* 文件操作工具栏 */}
            <div className="mb-4">
              <FileHandler />
            </div>
            
            {/* 主编辑区域 */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 左侧工具栏 */}
              <div className="lg:w-64 w-full">
                <Toolbar />
              </div>
              
              {/* 右侧画布区域 */}
              <div className="flex-1">
                <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center min-h-[400px]">
                  <CanvasEditor />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ImageEditorProvider>
  );
}
