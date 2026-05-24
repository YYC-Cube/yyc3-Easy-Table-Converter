"use client"
/**
 * @file 文档合并工具
 * @description 合并多个PDF文件为单一文档，支持拖拽排序和预览
 * @module converters/document-merge
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-28
 * @updated 2024-10-28
 */

'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 图标组件
import { Download, FileDown, FileImage, MoveHorizontal, Trash2, ArrowUp, ArrowDown, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// PDF处理服务
import { mergePDFs } from '@/lib/utils/pdfProcessor';

// 文件类型定义
interface PDFMergeItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  blobUrl?: string;
}

const DocumentMergePage: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);
  
  // 状态管理
  const [files, setFiles] = useState<PDFMergeItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [outputFileName, setOutputFileName] = useState('merged_document.pdf');
  const [includeBookmarks, setIncludeBookmarks] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    
    // 验证文件类型和大小
    const validFiles: PDFMergeItem[] = [];
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
      
      const newFile: PDFMergeItem = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending'
      };
      
      // 生成预览URL（如果浏览器支持）
      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, previewUrl: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }
      
      validFiles.push(newFile);
    }
    
    // 更新文件列表
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast({ 
        title: '成功上传', 
        description: `已添加 ${validFiles.length} 个文件到合并列表` 
      });
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
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;
    
    // 创建临时输入元素来触发handleFileUpload
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.files = droppedFiles;
    tempInput.multiple = true;
    
    // 模拟文件上传事件
    const mockEvent = {
      target: tempInput
    } as React.ChangeEvent<HTMLInputElement>;
    handleFileUpload(mockEvent);
  };
  
  // 移除单个文件
  const removeFile = (id: string) => {
    // 清理预览URL
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    if (fileToRemove?.blobUrl) {
      URL.revokeObjectURL(fileToRemove.blobUrl);
    }
    
    setFiles(prev => prev.filter(file => file.id !== id));
    
    if (files.length === 1) {
      toast({ 
        title: '提示', 
        description: '请添加至少两个文件进行合并' 
      });
    }
  };
  
  // 清除所有文件
  const clearAllFiles = () => {
    // 清理所有预览URL
    files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      if (file.blobUrl) {
        URL.revokeObjectURL(file.blobUrl);
      }
    });
    
    setFiles([]);
    setProcessingProgress(0);
  };
  
  // 开始合并PDF
  const startMerge = async () => {
    if (files.length < 2) {
      toast({ 
        title: '文件不足', 
        description: '请至少上传两个PDF文件进行合并' 
      });
      return;
    }
    
    // 验证输出文件名
    if (!outputFileName.trim()) {
      toast({ 
        title: '文件名无效', 
        description: '请输入有效的输出文件名' 
      });
      return;
    }
    
    // 确保文件名以.pdf结尾
    let finalFileName = outputFileName;
    if (!finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName += '.pdf';
      setOutputFileName(finalFileName);
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // 更新所有文件状态为处理中
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'processing' as const
      })));
    
    try {
      // 准备要合并的文件数组
      const filesToMerge = files.map(file => file.file);
      
      // 调用PDF合并函数
      const result = await mergePDFs(filesToMerge, (progress) => {
        setProcessingProgress(progress);
      });
      
      // 创建Blob URL
      const blobUrl = URL.createObjectURL(result);
      
      // 更新第一个文件的状态为完成（用于显示下载按钮）
      setFiles(prev => [
        {
          ...prev[0],
          status: 'completed' as const,
          blobUrl,
          name: finalFileName
        },
        ...prev.slice(1).map(file => ({
          ...file,
          status: 'completed' as const
        }))
      ]);
      
      toast({ 
        title: '合并完成', 
        description: `已成功合并 ${files.length} 个PDF文件` 
      });
      
    } catch (error) {
      // 更新文件状态为错误
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        errorMessage: error instanceof Error ? error.message : '合并失败'
      })));
      
      toast({ 
        title: '合并失败', 
        description: 'PDF合并过程中出现错误，请重试',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 下载合并后的文件
  const downloadMergedFile = () => {
    const completedFile = files.find(file => file.status === 'completed' && file.blobUrl);
    if (!completedFile?.blobUrl) return;
    
    const link = document.createElement('a');
    link.href = completedFile.blobUrl;
    link.download = completedFile.name;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 拖拽排序相关函数
  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };
  
  const handleDragEnd = () => {
    if (dragItemRef.current !== null && dragOverItemRef.current !== null && 
        dragItemRef.current !== dragOverItemRef.current) {
      
      const newFiles = [...files];
      const dragItem = newFiles[dragItemRef.current];
      
      // 移除拖拽的项
      newFiles.splice(dragItemRef.current, 1);
      // 插入到新位置
      newFiles.splice(dragOverItemRef.current, 0, dragItem);
      
      setFiles(newFiles);
    }
    
    // 重置拖拽状态
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };
  
  // 移动文件位置
  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    
    setFiles(newFiles);
  };
  
  // 渲染文件列表项
  const renderFileItem = (file: PDFMergeItem, index: number) => {
    const isCompleted = file.status === 'completed';
    const isError = file.status === 'error';
    const isProcessing = file.status === 'processing';
    
    return (
      <div 
        key={file.id} 
        className={`flex flex-col gap-2 p-4 border rounded-lg mb-2 transition-all ${dragOverItemRef.current === index ? 'border-blue-500 bg-blue-50' : ''}`}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragEnter={() => handleDragEnter(index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="relative w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                <FileImage className="h-5 w-5 text-blue-500" />
                <Badge className="absolute -top-1 -right-1 bg-blue-500">{index + 1}</Badge>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{file.name}</div>
              <div className="text-sm text-gray-500">
                {formatFileSize(file.size)}
                {isError && (
                  <span className="ml-2 text-red-500">错误</span>
                )}
              </div>
              {isError && file.errorMessage && (
                <div className="text-xs text-red-500 mt-1">{file.errorMessage}</div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* 上下移动按钮 */}
              {!isProcessing && !isCompleted && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveFile(index, index - 1)}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveFile(index, index + 1)}
                    disabled={index === files.length - 1}
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* 删除按钮 */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeFile(file.id)}
                disabled={isProcessing}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 下载按钮（仅合并完成后显示在第一个文件） */}
        {isCompleted && file.blobUrl && index === 0 && (
          <Button 
            className="w-full mt-2"
            onClick={downloadMergedFile}
          >
            <Download className="h-4 w-4 mr-2" />
            下载合并文件
          </Button>
        )}
        
        {/* 处理中进度条 */}
        {isProcessing && index === 0 && (
          <div className="space-y-1">
            <Progress value={processingProgress} className="h-1.5" />
            <div className="text-xs text-right text-gray-500">{processingProgress.toFixed(0)}%</div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto pt-20 pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PDF文档合并</h1>
        <p className="text-gray-600 mb-8">将多个PDF文件合并为一个文档，支持灵活排序和预览</p>
        
        <Tabs defaultValue="merge" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-6">
            <TabsTrigger value="merge">合并文件</TabsTrigger>
            <TabsTrigger value="settings">合并设置</TabsTrigger>
            <TabsTrigger value="guide">使用指南</TabsTrigger>
          </TabsList>
          
          <TabsContent value="merge" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardContent className="p-6">
                {/* 文件上传区域 */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FileDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">拖拽文件到此处或点击上传</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    支持多个PDF文件，每个文件最大50MB，至少需要两个文件
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
                    <CardTitle>合并列表 ({files.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllFiles}
                        disabled={isProcessing}
                      >
                        清除全部
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <MoveHorizontal className="h-4 w-4 text-gray-500" />
                      <span>拖拽文件调整顺序</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {files.map((file, index) => renderFileItem(file, index))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-3">
                    <div>
                      <Label htmlFor="output-filename" className="text-xs block mb-1">
                        输出文件名
                      </Label>
                      <Input 
                        id="output-filename"
                        value={outputFileName}
                        onChange={(e) => setOutputFileName(e.target.value)}
                        placeholder="merged_document.pdf"
                        disabled={isProcessing}
                        className="w-[250px]"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startMerge}
                    disabled={isProcessing || files.length < 2}
                  >
                    {isProcessing ? '合并中...' : '开始合并'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>合并设置</CardTitle>
                <CardDescription>调整PDF文档合并的高级选项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookmarks">保留书签和大纲</Label>
                    <Switch 
                      id="bookmarks" 
                      checked={includeBookmarks} 
                      onCheckedChange={setIncludeBookmarks}
                    />
                  </div>
                  <p className="text-sm text-gray-500 pl-0.5">
                    保留原始文档中的书签结构和导航大纲，便于在合并后的文档中快速导航
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold">合并限制</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>单个文件大小上限: 50MB</li>
                    <li>单次合并文件数量上限: 20个</li>
                    <li>合并后文件大小上限: 100MB</li>
                    <li>处理时间上限: 2分钟</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guide" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>使用指南</CardTitle>
                <CardDescription>了解如何高效使用PDF合并工具</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">合并步骤</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                    <li>
                      <strong>上传文件：</strong>
                      <p className="text-sm mt-1">
                        点击上传按钮或拖拽PDF文件到上传区域。您可以一次上传多个文件，或分批上传。
                      </p>
                    </li>
                    <li>
                      <strong>调整顺序：</strong>
                      <p className="text-sm mt-1">
                        通过拖拽文件调整合并顺序，或使用上下箭头按钮微调位置。文件将按照列表中的顺序进行合并。
                      </p>
                    </li>
                    <li>
                      <strong>设置输出名称：</strong>
                      <p className="text-sm mt-1">
                        在底部输入框中为合并后的文件指定一个名称。如果不指定，将使用默认名称。
                      </p>
                    </li>
                    <li>
                      <strong>开始合并：</strong>
                      <p className="text-sm mt-1">
                        点击"开始合并"按钮，等待处理完成。处理时间取决于文件数量和大小。
                      </p>
                    </li>
                    <li>
                      <strong>下载结果：</strong>
                      <p className="text-sm mt-1">
                        合并完成后，点击下载按钮获取合并后的PDF文件。
                      </p>
                    </li>
                  </ol>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">使用技巧</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">合并大量文件</div>
                        <p className="text-sm text-gray-600 mt-1">
                          如果您需要合并大量PDF文件，建议分批合并，然后再将结果合并为最终文档。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">保留导航结构</div>
                        <p className="text-sm text-gray-600 mt-1">
                          启用"保留书签和大纲"选项，可以在合并后的文档中保留原始文档的导航结构，便于快速定位内容。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">文档命名</div>
                        <p className="text-sm text-gray-600 mt-1">
                          为了便于管理，建议在上传前为文件命名，这样在合并列表中更容易识别和排序。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">常见问题</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">合并大文件需要多长时间？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        处理时间取决于文件大小、数量以及您的设备性能。一般来说，合并2-3个小型PDF文件只需要几秒钟，而合并大量或大型文件可能需要更长时间。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">合并后的文件质量会降低吗？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        不会，合并过程只是简单地将多个文件的内容组合在一起，不会影响原始文件的质量或压缩率。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">可以合并受密码保护的PDF吗？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        目前不支持直接合并受密码保护的PDF文件。您需要先移除密码保护，然后再进行合并。
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

export default DocumentMergePage;