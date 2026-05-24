"use client"
/**
 * @file 文档分割工具
 * @description 将PDF文件分割成多个独立文件，支持按页面范围、每N页分割和提取页面
 * @module converters/document-split
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// Tooltip组件暂未使用
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

// 图标组件
import { Download, FileDown, FileImage, Trash2, Copy, Check, AlertCircle, Eye, DownloadCloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// PDF处理服务
import { splitPDF } from '@/lib/utils/pdfProcessor';

// 分割模式类型
type SplitMode = 'range' | 'every-n-pages' | 'extract';

// 分割规则类型
interface SplitRule {
  id: string;
  name: string;
  pages: string;
  startPage?: number;
  endPage?: number;
}

// 处理结果类型
interface SplitResult {
  id: string;
  name: string;
  pages: number[];
  blob?: Blob;
  blobUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

// PDF页面信息类型
interface PDFPageInfo {
  index: number;
  width: number;
  height: number;
}

const DocumentSplitPage: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitRulesRef = useRef<HTMLTextAreaElement>(null);
  
  // 状态管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [pageRange, setPageRange] = useState<string>('');
  const [pagesPerSplit, setPagesPerSplit] = useState<number[]>([1]);
  const [extractPages, setExtractPages] = useState<string>('');
  const [results, setResults] = useState<SplitResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfPageInfo, setPdfPageInfo] = useState<PDFPageInfo[]>([]);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: '文件类型错误',
        description: '请上传PDF格式文件',
        variant: 'destructive'
      });
      return;
    }
    
    // 验证文件大小（最大50MB）
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: '文件过大',
        description: '文件大小不能超过50MB',
        variant: 'destructive'
      });
      return;
    }
    
    // 清除之前的状态
    resetProcessingState();
    
    // 设置新文件
    setSelectedFile(file);
    setFileSize(file.size);
    
    // 模拟PDF页面检测（实际应用中需要使用PDF解析库）
    // 这里假设随机生成5-50页的PDF
    const randomPages = Math.floor(Math.random() * 46) + 5;
    setTotalPages(randomPages);
    
    // 生成页面信息
    const pages: PDFPageInfo[] = [];
    for (let i = 0; i < randomPages; i++) {
      pages.push({
        index: i + 1,
        width: 595, // A4宽度
        height: 842 // A4高度
      });
    }
    setPdfPageInfo(pages);
    
    toast({
      title: '文件上传成功',
      description: `${file.name} (已检测 ${randomPages} 页)`
    });
    
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
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // 创建临时输入元素来触发handleFileUpload
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.files = e.dataTransfer.files;
    
    // 模拟ChangeEvent对象
    const mockEvent = {
      target: tempInput,
      currentTarget: tempInput,
      preventDefault: () => {},
      stopPropagation: () => {},
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      timeStamp: Date.now(),
      type: 'change',
      isTrusted: false
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileUpload(mockEvent);
  };
  
  // 移除选中的文件
  const removeFile = () => {
    setSelectedFile(null);
    setFileSize(0);
    setTotalPages(null);
    resetProcessingState();
    setPdfPageInfo([]);
  };
  
  // 重置处理状态
  const resetProcessingState = () => {
    // 清理之前的结果URL
    results.forEach(result => {
      if (result.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
    });
    
    setResults([]);
    setIsProcessing(false);
    setProcessingProgress(0);
    setPageRange('');
    setPagesPerSplit([1]);
    setExtractPages('');
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 解析页面范围字符串
  const parsePageRanges = (rangeString: string, totalPages: number): number[] => {
    const pages = new Set<number>();
    
    // 移除所有空白字符
    const cleanRange = rangeString.replace(/\s+/g, '');
    
    // 按逗号分割
    const ranges = cleanRange.split(',');
    
    for (const range of ranges) {
      if (!range) continue;
      
      // 处理范围（如 1-5）
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          const actualStart = Math.max(1, Math.min(start, totalPages));
          const actualEnd = Math.max(actualStart, Math.min(end, totalPages));
          
          for (let i = actualStart; i <= actualEnd; i++) {
            pages.add(i);
          }
        }
      } 
      // 处理单个页面
      else {
        const pageNum = Number(range);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pages.add(pageNum);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };
  
  // 解析分割规则
  const parseSplitRules = (rulesText: string, totalPages: number): SplitRule[] => {
    const rules: SplitRule[] = [];
    const lines = rulesText.trim().split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      // 格式：文件名: 页面范围
      const match = trimmedLine.match(/^(.*?):\s*(.*)$/);
      if (match) {
        const [, name, pages] = match;
        if (name && pages) {
          const parsedPages = parsePageRanges(pages, totalPages);
          if (parsedPages.length > 0) {
            rules.push({
              id: crypto.randomUUID(),
              name: name.trim(),
              pages: pages.trim(),
              startPage: parsedPages[0],
              endPage: parsedPages[parsedPages.length - 1]
            });
          }
        }
      }
    }
    
    return rules;
  };
  
  // 生成每N页分割的规则
  const generateEveryNPagesRules = (pagesPerGroup: number, totalPages: number): SplitRule[] => {
    const rules: SplitRule[] = [];
    const pageCount = pagesPerGroup;
    
    for (let i = 1; i <= totalPages; i += pageCount) {
      const start = i;
      const end = Math.min(i + pageCount - 1, totalPages);
      
      rules.push({
        id: crypto.randomUUID(),
        name: `pages_${start}-${end}`,
        pages: `${start}-${end}`,
        startPage: start,
        endPage: end
      });
    }
    
    return rules;
  };
  
  // 生成提取页面的规则
  const generateExtractRules = (extractString: string, totalPages: number): SplitRule[] => {
    const pages = parsePageRanges(extractString, totalPages);
    
    if (pages.length === 0) return [];
    
    // 如果只提取一页
    if (pages.length === 1) {
      return [{
        id: crypto.randomUUID(),
        name: `page_${pages[0]}`,
        pages: `${pages[0]}`,
        startPage: pages[0],
        endPage: pages[0]
      }];
    }
    
    // 如果提取多页，创建一个规则
    return [{
      id: crypto.randomUUID(),
      name: `extracted_pages`,
      pages: extractString,
      startPage: pages[0],
      endPage: pages[pages.length - 1]
    }];
  };
  
  // 开始分割
  const startSplit = async () => {
    if (!selectedFile) {
      toast({
        title: '未选择文件',
        description: '请先上传PDF文件',
        variant: 'destructive'
      });
      return;
    }
    
    if (!totalPages) {
      toast({
        title: '文件信息未加载',
        description: '请等待文件信息加载完成',
        variant: 'destructive'
      });
      return;
    }
    
    let rules: SplitRule[] = [];
    
    // 根据选择的分割模式生成规则
    switch (splitMode) {
      case 'range':
        if (!pageRange.trim()) {
          toast({
            title: '请输入分割规则',
            description: '使用格式如：第一部分: 1-5, 第二部分: 6-10',
            variant: 'destructive'
          });
          return;
        }
        rules = parseSplitRules(pageRange, totalPages);
        break;
        
      case 'every-n-pages':
        const pagesPerGroup = pagesPerSplit[0];
        if (pagesPerGroup < 1) {
          toast({
            title: '无效的分割值',
            description: '每N页分割的值必须大于0',
            variant: 'destructive'
          });
          return;
        }
        rules = generateEveryNPagesRules(pagesPerGroup, totalPages);
        break;
        
      case 'extract':
        if (!extractPages.trim()) {
          toast({
            title: '请输入要提取的页面',
            description: '使用格式如：1,3,5-7',
            variant: 'destructive'
          });
          return;
        }
        rules = generateExtractRules(extractPages, totalPages);
        break;
    }
    
    if (rules.length === 0) {
      toast({
        title: '无效的分割规则',
        description: '请检查并修正分割规则',
        variant: 'destructive'
      });
      return;
    }
    
    // 准备结果状态
    const initialResults: SplitResult[] = rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      pages: parsePageRanges(rule.pages, totalPages),
      status: 'pending'
    }));
    
    setResults(initialResults);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // 处理每个分割规则
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const pages = parsePageRanges(rule.pages, totalPages);
        
        // 更新当前处理的结果状态
        setResults(prev => prev.map(result => 
          result.id === rule.id ? { ...result, status: 'processing' } : result
        ));
        
        // 调用PDF分割函数
        const result = await splitPDF(selectedFile, pages, (progress) => {
          // 计算总体进度
          const itemProgress = progress / rules.length;
          const overallProgress = (i / rules.length) * 100 + itemProgress;
          setProcessingProgress(overallProgress);
        });
        
        // 创建Blob URL - 确保传递单个Blob对象
        const blobUrl = result instanceof Blob ? URL.createObjectURL(result) : URL.createObjectURL(new Blob(result));
        
        // 更新结果状态
        setResults(prev => prev.map(item => 
          item.id === rule.id 
            ? { 
                ...item, 
                status: 'completed' as const, 
                blob: result instanceof Blob ? result : new Blob(result),
                blobUrl 
              } 
            : item
        ));
      }
      
      toast({
        title: '分割完成',
        description: `成功将文档分割为 ${rules.length} 个文件`
      });
      
    } catch (error) {
      // 更新所有结果状态为错误
      setResults(prev => prev.map(result => ({
        ...result,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '分割失败'
      })));
      
      toast({
        title: '分割失败',
        description: 'PDF分割过程中出现错误，请重试',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 下载分割结果
  const downloadResult = (result: SplitResult) => {
    if (!result.blobUrl) return;
    
    // 确保文件名以.pdf结尾
    let fileName = result.name;
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }
    
    const link = document.createElement('a');
    link.href = result.blobUrl;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 批量下载所有结果
  const downloadAllResults = () => {
    const completedResults = results.filter(r => r.status === 'completed' && r.blobUrl);
    
    if (completedResults.length === 0) {
      toast({
        title: '无可下载文件',
        description: '请先完成分割操作',
        variant: 'destructive'
      });
      return;
    }
    
    // 逐个下载文件
    completedResults.forEach((result, index) => {
      // 延迟下载，避免浏览器限制
      setTimeout(() => {
        downloadResult(result);
      }, index * 300);
    });
    
    toast({
      title: '开始下载',
      description: `正在下载 ${completedResults.length} 个文件`
    });
  };
  
  // 复制分割规则模板到剪贴板
  const copyTemplateToClipboard = () => {
    const template = `# PDF分割规则模板\n# 每行格式：文件名: 页面范围\n# 例如：\n第一部分: 1-5\n第二部分: 6-10\n附录: 11-15\n`;
    
    navigator.clipboard.writeText(template).then(() => {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      toast({
        title: '已复制',
        description: '分割规则模板已复制到剪贴板'
      });
    });
  };
  
  // 渲染分割模式设置
  const renderSplitModeSettings = () => {
    switch (splitMode) {
      case 'range':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="split-rules">分割规则</Label>
              <div className="mt-1 relative">
                <textarea
                  ref={splitRulesRef}
                  id="split-rules"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder={`# 使用以下格式定义分割规则\n# 每行格式：文件名: 页面范围\n封面和目录: 1-5\n正文部分: 6-20\n附录: 21-30`}
                  className="w-full min-h-[150px] p-3 border rounded-md font-mono text-sm resize-y"
                  disabled={isProcessing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={copyTemplateToClipboard}
                  disabled={isProcessing}
                >
                  {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                使用格式：文件名: 页面范围，如 "第一部分: 1-5"。支持单行多页："重要页面: 1,3,5-7"
              </p>
            </div>
          </div>
        );
        
      case 'every-n-pages':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="pages-per-split">每N页分割为一个文件</Label>
                <Badge variant="outline">{pagesPerSplit[0]} 页/文件</Badge>
              </div>
              <Slider
                id="pages-per-split"
                value={pagesPerSplit}
                min={1}
                max={10}
                step={1}
                onValueChange={setPagesPerSplit}
                disabled={isProcessing}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1页</span>
                <span>5页</span>
                <span>10页</span>
              </div>
            </div>
            
            {totalPages && (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-sm">
                  <span className="font-medium">预计生成:</span> {Math.ceil(totalPages / pagesPerSplit[0])} 个文件
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  文件命名格式: pages_1-5, pages_6-10, ...
                </div>
              </div>
            )}
          </div>
        );
        
      case 'extract':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="extract-pages">提取页面</Label>
              <Input
                id="extract-pages"
                value={extractPages}
                onChange={(e) => setExtractPages(e.target.value)}
                placeholder="例如: 1,3,5-7"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                输入要提取的页面，支持单个页面和范围。例如：1,3,5-7 将提取第1、3、5、6、7页
              </p>
            </div>
            
            {extractPages && totalPages && (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-sm">
                  <span className="font-medium">将提取:</span> {parsePageRanges(extractPages, totalPages).length} 页
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {parsePageRanges(extractPages, totalPages).join(', ')}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto pt-20 pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PDF文档分割</h1>
        <p className="text-gray-600 mb-8">将单个PDF文件分割成多个独立文件，支持多种分割方式</p>
        
        <Tabs defaultValue="split" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-6">
            <TabsTrigger value="split">分割文件</TabsTrigger>
            <TabsTrigger value="preview">页面预览</TabsTrigger>
            <TabsTrigger value="guide">使用指南</TabsTrigger>
          </TabsList>
          
          <TabsContent value="split" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardContent className="p-6">
                {/* 文件上传区域 */}
                {!selectedFile ? (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <FileDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">拖拽PDF文件到此处或点击上传</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      支持单个PDF文件，最大50MB
                    </p>
                    <Button>
                      选择PDF文件
                    </Button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded">
                          <FileImage className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedFile.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(fileSize)} · {totalPages || '未知'} 页
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {/* 预览功能待实现 */}}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          预览
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={removeFile}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          移除
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 分割设置区域 */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle>分割设置</CardTitle>
                  <CardDescription>选择分割模式并设置相应的参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 分割模式选择 */}
                  <RadioGroup 
                    value={splitMode} 
                    onValueChange={(value: SplitMode) => setSplitMode(value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="range" id="mode-range" />
                      <Label htmlFor="mode-range" className="flex-1 cursor-pointer">
                        <div className="font-medium">按命名范围分割</div>
                        <div className="text-sm text-gray-500">自定义文件名和页面范围</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="every-n-pages" id="mode-every-n" />
                      <Label htmlFor="mode-every-n" className="flex-1 cursor-pointer">
                        <div className="font-medium">每N页分割</div>
                        <div className="text-sm text-gray-500">按固定页数自动分割</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="extract" id="mode-extract" />
                      <Label htmlFor="mode-extract" className="flex-1 cursor-pointer">
                        <div className="font-medium">提取指定页面</div>
                        <div className="text-sm text-gray-500">仅提取需要的页面</div>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <Separator />
                  
                  {/* 分割参数设置 */}
                  {renderSplitModeSettings()}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={startSplit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '分割中...' : '开始分割'}
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* 分割结果区域 */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>分割结果 ({results.filter(r => r.status === 'completed').length}/{results.length})</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={downloadAllResults}
                      disabled={isProcessing || results.every(r => r.status !== 'completed')}
                    >
                      <DownloadCloud className="h-4 w-4 mr-1" />
                      全部下载
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {results.map(result => {
                        const isCompleted = result.status === 'completed';
                        const isError = result.status === 'error';
                        const isProcessing = result.status === 'processing';
                        
                        return (
                          <div key={result.id} className={`border rounded-lg p-4 transition-all ${isError ? 'border-red-200 bg-red-50' : isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{result.name}.pdf</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  页面: {result.pages.join(', ')}
                                  {isError && (
                                    <span className="ml-2 text-red-500">错误</span>
                                  )}
                                </div>
                                {isError && result.errorMessage && (
                                  <div className="text-xs text-red-500 mt-1">{result.errorMessage}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {/* 状态指示器 */}
                                {isProcessing && (
                                  <Badge variant="outline">处理中</Badge>
                                )}
                                {isCompleted && (
                                  <Badge className="bg-green-500">完成</Badge>
                                )}
                                {isError && (
                                  <Badge className="bg-red-500">失败</Badge>
                                )}
                                
                                {/* 下载按钮 */}
                                <Button 
                                  size="sm"
                                  onClick={() => downloadResult(result)}
                                  disabled={!isCompleted || !result.blobUrl}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  下载
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
                
                {/* 处理进度条 */}
                {isProcessing && (
                  <div className="border-t p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>处理进度</span>
                        <span>{processingProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={processingProgress} className="h-2" />
                    </div>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>页面预览</CardTitle>
                <CardDescription>查看PDF文档的页面结构，便于设置分割规则</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFile && totalPages ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">文档:</span> {selectedFile.name}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">总页数:</span> {totalPages}
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pdfPageInfo.map((page) => (
                          <div 
                            key={page.index} 
                            className="border rounded-md p-3 text-center hover:border-blue-500 cursor-pointer transition-colors"
                          >
                            <div className="bg-gray-100 aspect-[210/297] rounded mb-2 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">第 {page.index} 页</span>
                            </div>
                            <div className="text-sm font-medium">第 {page.index} 页</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">未选择PDF文件</h3>
                    <p className="text-gray-400">请先上传PDF文件以查看页面预览</p>
                    <Button 
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      上传文件
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guide" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>使用指南</CardTitle>
                <CardDescription>了解如何高效使用PDF分割工具</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">分割步骤</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                    <li>
                      <strong>上传文件：</strong>
                      <p className="text-sm mt-1">
                        点击上传按钮或拖拽PDF文件到上传区域。目前仅支持单个文件上传，最大50MB。
                      </p>
                    </li>
                    <li>
                      <strong>选择分割模式：</strong>
                      <p className="text-sm mt-1">
                        有三种分割模式可供选择：按命名范围、每N页分割、提取指定页面。
                      </p>
                    </li>
                    <li>
                      <strong>设置分割参数：</strong>
                      <p className="text-sm mt-1">
                        根据选择的分割模式，设置相应的参数。可以参考预览页面查看文档的页面结构。
                      </p>
                    </li>
                    <li>
                      <strong>开始分割：</strong>
                      <p className="text-sm mt-1">
                        点击"开始分割"按钮，等待处理完成。处理时间取决于文件大小和复杂度。
                      </p>
                    </li>
                    <li>
                      <strong>下载结果：</strong>
                      <p className="text-sm mt-1">
                        分割完成后，可以单独下载每个结果文件，或使用"全部下载"按钮批量下载。
                      </p>
                    </li>
                  </ol>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">分割模式说明</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">按命名范围分割</div>
                      <p className="text-sm text-gray-600 mt-1">
                        使用自定义的文件名和页面范围来分割PDF。每行格式为：文件名: 页面范围。
                      </p>
                      <div className="bg-gray-50 p-3 rounded mt-2 font-mono text-xs">
                        <div># 这是注释行，以#开头</div>
                        <div>封面和目录: 1-5</div>
                        <div>第一章: 6-20</div>
                        <div>第二章: 21-40</div>
                        <div>重要图表: 15, 25, 35</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">每N页分割</div>
                      <p className="text-sm text-gray-600 mt-1">
                        按照固定的页数自动分割PDF。例如，每5页分割一次，一个20页的文档会被分割为4个文件。
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">提取指定页面</div>
                      <p className="text-sm text-gray-600 mt-1">
                        仅提取PDF中的特定页面。支持单个页面和范围。例如：1,3,5-7 将提取第1、3、5、6、7页。
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">常见问题</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">如何分割大文件？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        对于大型PDF文件，建议使用"每N页分割"模式，设置较小的N值（如1-3页），以避免生成过大的结果文件。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">分割后的文件质量如何？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        分割过程不会改变原始文件的质量或压缩率，分割后的文件将保留原始页面的所有内容和格式。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">可以分割受密码保护的PDF吗？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        目前不支持直接分割受密码保护的PDF文件。您需要先移除密码保护，然后再进行分割。
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">如何快速设置分割规则？</div>
                      <p className="text-sm text-gray-600 mt-1">
                        点击分割规则输入框右上角的复制按钮，可以获取规则模板。编辑模板后粘贴回输入框即可。
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

export default DocumentSplitPage;