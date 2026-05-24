"use client"
/**
 * @file PDF智能压缩工具
 * @description 优化PDF文件大小，保持文档质量，支持批量处理
 * @module converters/pdf-compress
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-28
 * @updated 2024-10-28
 */

'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// 图标组件
import { Download, FileDown, FileImage, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// PDF处理服务
import { compressPDF } from '@/lib/utils/pdfProcessor';

// 文件类型定义
interface PDFItem {
  id: string;
  file: File;
  name: string;
  size: number;
  compressedSize?: number;
  compressionRatio?: number;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  blobUrl?: string;
}

// 压缩质量选项
type CompressionQuality = 'high' | 'medium' | 'low';

const PDFCompressPage: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 状态管理
  const [files, setFiles] = useState<PDFItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [enableImageCompression, setEnableImageCompression] = useState(true);
  const [imageQuality, setImageQuality] = useState(75);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [removeAnnotations, setRemoveAnnotations] = useState(false);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    
    // 验证文件类型和大小
    const validFiles: PDFItem[] = [];
    const invalidFiles: string[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      // 检查文件类型
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        invalidFiles.push(`${file.name} (不是PDF文件)`);
        continue;
      }
      
      // 检查文件大小（最大50MB）
      if (file.size > 50 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (文件过大，最大支持50MB)`);
        continue;
      }
      
      validFiles.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending'
      });
    }
    
    // 更新文件列表
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      if (validFiles.length > 1) {
        toast({ title: '成功上传', description: `已添加 ${validFiles.length} 个文件` });
      }
    }
    
    // 显示无效文件警告
    if (invalidFiles.length > 0) {
      toast({ 
        title: '上传失败', 
        description: invalidFiles.join(', '),
        variant: 'destructive'
      });
    }
    
    // 重置文件输入，允许重新上传相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;
    
    // 直接创建合成事件对象
  const syntheticEvent = {
    target: {
      files: droppedFiles
    }
  } as unknown as React.ChangeEvent<HTMLInputElement>;
  
  handleFileUpload(syntheticEvent);
  };
  
  // 移除单个文件
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    
    // 如果移除的是已生成blobUrl的文件，清理URL
    const removedFile = files.find(file => file.id === id);
    if (removedFile?.blobUrl) {
      URL.revokeObjectURL(removedFile.blobUrl);
    }
  };
  
  // 清除所有文件
  const clearAllFiles = () => {
    // 清理所有blobUrl
    files.forEach(file => {
      if (file.blobUrl) {
        URL.revokeObjectURL(file.blobUrl);
      }
    });
    
    setFiles([]);
    setOverallProgress(0);
  };
  
  // 开始压缩PDF
  const startCompression = async () => {
    if (files.length === 0) {
      toast({ title: '请先上传文件', description: '需要至少一个PDF文件才能开始压缩' });
      return;
    }
    
    // 重置所有文件状态，不明确设置undefined值
    const updatedFiles = files.map(file => ({
      ...file,
      progress: 0,
      status: 'pending' as const
    }));
    
    setFiles(updatedFiles);
    setIsCompressing(true);
    setOverallProgress(0);
    setIsProcessing(true);
    
    try {
      // 逐个处理文件
      let completedCount = 0;
      
      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i];
        
        // 更新文件状态为处理中
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' as const } : f
        ));
        
        try {
          // 调用PDF压缩函数
          const result = await compressPDF(file.file, {
            quality,
            enableImageCompression,
            imageQuality,
            removeMetadata,
            removeAnnotations,
            onProgress: (progress) => {
              // 更新单个文件进度
              setFiles(prev => prev.map(f => 
                f.id === file.id ? { ...f, progress } : f
              ));
              
              // 更新整体进度
              const currentProgress = ((completedCount + progress / 100) / files.length) * 100;
              setOverallProgress(currentProgress);
            }
          });
          
          // 计算压缩比率
          const compressionRatio = ((file.size - result.size) / file.size) * 100;
          
          // 更新文件状态为完成
          setFiles(prev => prev.map(f => 
            f.id === file.id ? {
              ...f,
              status: 'completed' as const,
              compressedSize: result.size,
              compressionRatio,
              blobUrl: URL.createObjectURL(result)
            } : f
          ));
          
          completedCount++;
          setOverallProgress((completedCount / files.length) * 100);
          
        } catch (error) {
          // 更新文件状态为错误
          setFiles(prev => prev.map(f => 
            f.id === file.id ? {
              ...f,
              status: 'error' as const,
              errorMessage: error instanceof Error ? error.message : '压缩失败'
            } : f
          ));
          
          completedCount++;
          setOverallProgress((completedCount / files.length) * 100);
        }
      }
      
      // 检查是否所有文件都处理完成，确保正确处理所有可能的状态类型
      const hasErrors = updatedFiles.some(file => (file.status as string) === 'error');
      const allCompleted = updatedFiles.length === completedCount;
      
      if (allCompleted && !hasErrors) {
        toast({ title: '压缩完成', description: '所有文件已成功压缩' });
      } else if (allCompleted && hasErrors) {
        toast({ 
          title: '部分压缩失败', 
          description: '请查看错误信息并重试',
          variant: 'destructive'
        });
      }
      
    } finally {
      setIsCompressing(false);
      setIsProcessing(false);
    }
  };
  
  // 下载压缩后的文件
  const downloadFile = (file: PDFItem) => {
    if (!file.blobUrl) return;
    
    const link = document.createElement('a');
    link.href = file.blobUrl;
    
    // 生成下载文件名
    const originalName = file.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    link.download = `${nameWithoutExt}_compressed${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 批量下载所有压缩后的文件
  const downloadAllFiles = () => {
    files.forEach(file => {
      if (file.status === 'completed' && file.blobUrl) {
        downloadFile(file);
      }
    });
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 渲染文件列表项
  const renderFileItem = (file: PDFItem) => {
    return (
      <div key={file.id} className="flex flex-col gap-2 p-4 border rounded-lg mb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileImage className="h-6 w-6 text-blue-500" />
            <div>
              <div className="font-medium truncate max-w-md">{file.name}</div>
              <div className="text-sm text-gray-500">
                原始大小: {formatFileSize(file.size)}
                {file.compressedSize && (
                  <span className="ml-2">→ 压缩后: {formatFileSize(file.compressedSize)}</span>
                )}
                {file.compressionRatio && (
                  <Badge className={`ml-2 ${file.compressionRatio > 50 ? 'bg-green-500' : 'bg-blue-500'}`}>
                    -{(100 - file.compressionRatio).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => removeFile(file.id)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {file.status === 'processing' && (
          <div className="space-y-1">
            <Progress value={file.progress} className="h-1.5" />
            <div className="text-xs text-right text-gray-500">{file.progress.toFixed(0)}%</div>
          </div>
        )}
        
        {file.status === 'error' && (
          <div className="text-xs text-red-500">{file.errorMessage}</div>
        )}
        
        {file.status === 'completed' && file.blobUrl && (
          <Button 
            className="w-full sm:w-auto mt-2" 
            onClick={() => downloadFile(file)}
          >
            <Download className="h-4 w-4 mr-2" />
            下载压缩文件
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto pt-20 pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PDF 智能压缩</h1>
        <p className="text-gray-600 mb-8">优化PDF文件大小，保持文档质量，支持批量处理</p>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-6">
            <TabsTrigger value="upload">上传文件</TabsTrigger>
            <TabsTrigger value="settings">压缩设置</TabsTrigger>
            <TabsTrigger value="guide">使用指南</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardContent className="p-6">
                {/* 文件上传区域 */}
                <div 
                  className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FileDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">拖拽文件到此处或点击上传</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    支持单个或多个PDF文件，每个文件最大50MB
                  </p>
                  <Button>
                    选择PDF文件
                  </Button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* 已上传文件列表 */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>已上传文件 ({files.length})</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFiles}
                      disabled={isProcessing}
                    >
                      清除全部
                    </Button>
                  </div>
                  <CardDescription>点击文件旁的删除按钮可移除不需要的文件</CardDescription>
                </CardHeader>
                <CardContent>
                  {isProcessing && (
                    <div className="mb-4 space-y-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>整体进度</span>
                        <span>{overallProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                  )}
                  
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {files.map(file => renderFileItem(file))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    可压缩文件: {files.filter(f => f.status === 'pending' || f.status === 'error').length}
                    {files.some(f => f.status === 'completed') && (
                      <span className="ml-4">
                        已完成: {files.filter(f => f.status === 'completed').length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-x-3">
                    {files.some(f => f.status === 'completed') && (
                      <Button onClick={downloadAllFiles}>
                        <Download className="h-4 w-4 mr-2" />
                        下载全部
                      </Button>
                    )}
                    
                    <Button 
                      onClick={startCompression}
                      disabled={isCompressing || files.length === 0 || 
                        !files.some(f => f.status === 'pending' || f.status === 'error')}
                    >
                      {isCompressing ? '压缩中...' : '开始压缩'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>压缩设置</CardTitle>
                <CardDescription>调整这些设置以获得最佳的压缩效果和质量平衡</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="quality">压缩质量预设</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${quality === 'high' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => setQuality('high')}
                    >
                      <div className="font-medium">高质量</div>
                      <div className="text-sm text-gray-500">较小压缩率，保留更多细节</div>
                    </div>
                    <div 
                      className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${quality === 'medium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => setQuality('medium')}
                    >
                      <div className="font-medium">平衡</div>
                      <div className="text-sm text-gray-500">适中的压缩率和质量</div>
                    </div>
                    <div 
                      className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${quality === 'low' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => setQuality('low')}
                    >
                      <div className="font-medium">高压缩</div>
                      <div className="text-sm text-gray-500">最大压缩率，质量可能降低</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="image-compression">图像压缩</Label>
                    <Switch 
                      id="image-compression" 
                      checked={enableImageCompression} 
                      onCheckedChange={setEnableImageCompression}
                    />
                  </div>
                  
                  {enableImageCompression && (
                    <div className="space-y-2 pl-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">图像质量: {imageQuality}%</span>
                        <Badge variant="outline">{imageQuality < 50 ? '高压缩' : imageQuality > 80 ? '低压缩' : '平衡'}</Badge>
                      </div>
                      <Slider 
                        id="image-quality" 
                        min={10} 
                        max={100} 
                        step={1} 
                        value={[imageQuality]} 
                        onValueChange={(value) => setImageQuality(value[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>最小质量</span>
                        <span>最大质量</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metadata">移除元数据</Label>
                    <Switch 
                      id="metadata" 
                      checked={removeMetadata} 
                      onCheckedChange={setRemoveMetadata}
                    />
                  </div>
                  <p className="text-sm text-gray-500 pl-0.5">
                    移除文档属性、作者信息、创建日期等元数据，可进一步减小文件大小
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="annotations">移除注释和表单</Label>
                    <Switch 
                      id="annotations" 
                      checked={removeAnnotations} 
                      onCheckedChange={setRemoveAnnotations}
                    />
                  </div>
                  <p className="text-sm text-gray-500 pl-0.5">
                    移除文档中的注释、表单字段和交互元素，谨慎使用
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guide" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>使用指南</CardTitle>
                <CardDescription>了解如何高效使用PDF压缩工具</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">压缩原理</h3>
                  <p className="text-gray-600">
                    PDF压缩工具通过以下方式减小文件大小：
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600">
                    <li>优化图像压缩和分辨率</li>
                    <li>移除不必要的元数据和隐藏信息</li>
                    <li>简化文档结构和字体嵌入</li>
                    <li>清理冗余内容和空白</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">使用建议</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600">
                    <li>对于重要文档，建议选择"高质量"预设以保留更多细节</li>
                    <li>对于仅用于屏幕查看的文档，可以使用"高压缩"预设获得最小文件</li>
                    <li>图像密集型PDF文件可以获得更显著的压缩效果</li>
                    <li>移除元数据可以保护隐私并进一步减小文件大小</li>
                    <li>批量处理多个文件时，总大小最好不超过200MB以确保性能</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">常见问题</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">压缩后PDF的质量会下降吗？</div>
                      <p className="text-sm text-gray-600">
                        根据选择的压缩级别，图像质量可能会有不同程度的降低。选择"高质量"预设通常不会明显影响视觉质量。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">压缩后的文件能减少多少大小？</div>
                      <p className="text-sm text-gray-600">
                        这取决于原始PDF的内容。含有大量图像的PDF通常可以减少50-80%的大小，而主要是文本的PDF可能只能减少10-30%。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">处理大文件需要多长时间？</div>
                      <p className="text-sm text-gray-600">
                        处理时间取决于文件大小、复杂度以及您的设备性能。一般来说，10MB的文件处理时间在几秒到一分钟之间。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PDFCompressPage;