"use client"

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Download, Upload, Loader2, ImagePlus, Maximize2, AlertCircle, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { resizeImage } from '@/lib/utils/imageProcessor';

export default function ImageResizePage() {
  // 基本状态
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string>("");
  const [processedPreview, setProcessedPreview] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 尺寸调整参数
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [resizeMode, setResizeMode] = useState<'exact' | 'percentage'>('exact');
  const [percentage, setPercentage] = useState(100);
  const [outputFormat, setOutputFormat] = useState<'auto' | 'png' | 'jpeg' | 'webp'>('auto');
  const [quality, setQuality] = useState(90);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  
  // 预设尺寸
  const presets = [
    { id: 'custom', name: '自定义' },
    { id: 'facebook-cover', name: 'Facebook 封面', width: 820, height: 312 },
    { id: 'twitter-header', name: 'Twitter 头图', width: 1500, height: 500 },
    { id: 'instagram-post', name: 'Instagram 帖子', width: 1080, height: 1080 },
    { id: 'instagram-story', name: 'Instagram 快拍', width: 1080, height: 1920 },
    { id: 'linkedin-cover', name: 'LinkedIn 封面', width: 1128, height: 191 },
    { id: 'youtube-thumbnail', name: 'YouTube 缩略图', width: 1280, height: 720 },
    { id: 'ios-icon', name: 'iOS 应用图标', width: 1024, height: 1024 },
    { id: 'android-icon', name: 'Android 应用图标', width: 512, height: 512 },
    { id: 'website-favicon', name: '网站 Favicon', width: 32, height: 32 },
  ];

  // 处理图片上传
  const handleFileUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({ title: '错误', description: '请上传图片文件', variant: 'destructive' });
      return;
    }

    // 检查文件大小（10MB限制）
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    if (file.size > MAX_SIZE_BYTES) {
      toast({ 
        title: '文件过大', 
        description: `图片大小不能超过${MAX_SIZE_MB}MB，当前文件大小：${(file.size / (1024 * 1024)).toFixed(2)}MB`, 
        variant: 'destructive' 
      });
      return;
    }

    setSourceFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      setSourcePreview(previewUrl);
      
      // 创建图片对象获取原始尺寸
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width.toString());
        setHeight(img.height.toString());
        setSelectedPreset('custom'); // 重置预设选择
      };
      img.src = previewUrl;
    };
    reader.readAsDataURL(file);
  };

  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  // 处理预设尺寸选择
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find(p => p.id === presetId);
    
    if (preset && preset.width && preset.height) {
      setWidth(preset.width.toString());
      setHeight(preset.height.toString());
      setResizeMode('exact'); // 预设尺寸使用精确尺寸模式
    }
  };

  // 处理宽度变化
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    
    if (preserveAspectRatio && originalWidth > 0) {
      const aspectRatio = originalHeight / originalWidth;
      const newHeight = Math.round(parseInt(newWidth) * aspectRatio);
      setHeight(newHeight.toString());
    }
  };

  // 处理高度变化
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    
    if (preserveAspectRatio && originalHeight > 0) {
      const aspectRatio = originalWidth / originalHeight;
      const newWidth = Math.round(parseInt(newHeight) * aspectRatio);
      setWidth(newWidth.toString());
    }
  };

  // 处理百分比变化
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = parseInt(e.target.value);
    setPercentage(newPercentage);
    
    if (originalWidth > 0 && originalHeight > 0) {
      const newWidth = Math.round(originalWidth * newPercentage / 100);
      const newHeight = Math.round(originalHeight * newPercentage / 100);
      setWidth(newWidth.toString());
      setHeight(newHeight.toString());
    }
  };

  // 执行尺寸调整
  const handleResize = async () => {
    if (!sourceFile || !width || !height) {
      toast({ title: '提示', description: '请上传图片并设置尺寸', variant: 'default' });
      return;
    }

    try {
      const targetWidth = parseInt(width);
      const targetHeight = parseInt(height);
      
      // 验证尺寸范围
      if (targetWidth <= 0 || targetHeight <= 0) {
        toast({ title: '错误', description: '请输入有效的尺寸值', variant: 'destructive' });
        return;
      }
      
      if (targetWidth > 10000 || targetHeight > 10000) {
        toast({ title: '错误', description: '尺寸过大，请输入合理的尺寸值', variant: 'destructive' });
        return;
      }

      setProcessing(true);
      
      const format = outputFormat === 'auto' ? sourceFile.type.split('/')[1] : outputFormat;
      
      const result = await resizeImage(
        sourceFile,
        targetWidth,
        targetHeight,
        format,
        quality,
        preserveAspectRatio
      );
      
      if (result.success && result.data) {
        setProcessedBlob(result.data);
        const url = URL.createObjectURL(result.data);
        
        // 清理之前的预览URL
        if (processedPreview) {
          URL.revokeObjectURL(processedPreview);
        }
        
        setProcessedPreview(url);
        
        // 显示成功提示
        toast({ 
          title: '成功', 
          description: '图片尺寸调整成功', 
          variant: 'default' 
        });
      } else {
        throw new Error(result.error || '调整失败');
      }
    } catch (error) {
      toast({ 
        title: '错误', 
        description: error instanceof Error ? error.message : '图片尺寸调整失败', 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  // 复制结果图片到剪贴板
  const copyToClipboard = async () => {
    if (!processedBlob) return;
    
    try {
      // 将Blob转换为ClipboardItem
      const item = new ClipboardItem({
        [processedBlob.type]: processedBlob
      });
      
      await navigator.clipboard.write([item]);
      setCopied(true);
      toast({ title: '成功', description: '图片已复制到剪贴板', variant: 'default' });
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({ 
        title: '错误', 
        description: '复制失败，请尝试下载图片', 
        variant: 'destructive' 
      });
    }
  };

  // 计算文件大小变化
  const calculateSizeInfo = useCallback(() => {
    if (!sourceFile || !processedBlob) return null;
    
    const originalSizeMB = (sourceFile.size / (1024 * 1024)).toFixed(2);
    const newSizeMB = (processedBlob.size / (1024 * 1024)).toFixed(2);
    const sizeDiff = parseFloat(newSizeMB) - parseFloat(originalSizeMB);
    const percentageChange = sourceFile.size > 0 
      ? ((processedBlob.size - sourceFile.size) / sourceFile.size * 100).toFixed(1)
      : '0';
    
    return {
      originalSizeMB,
      newSizeMB,
      sizeDiff: sizeDiff.toFixed(2),
      percentageChange,
      isReduced: sizeDiff < 0
    };
  }, [sourceFile, processedBlob]);

  // 下载调整后的图片
  const handleDownload = () => {
    if (!processedBlob) return;
    
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-${sourceFile?.name || 'image'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">图片尺寸调整</h1>
            <p className="text-gray-600">精确控制图片尺寸，支持多种调整模式和输出格式</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 图片上传和预览 */}
            <Card>
              <CardHeader>
                <CardTitle>上传图片</CardTitle>
                <CardDescription>支持JPG、PNG、WebP等常见图片格式</CardDescription>
              </CardHeader>
              <CardContent>
                {!sourcePreview ? (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">点击或拖拽图片到此处上传</p>
                    <p className="text-gray-400 text-sm mt-2">支持 JPG, PNG, WebP 等格式</p>
                    <p className="text-gray-400 text-xs mt-1">最大文件大小：10MB</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 flex justify-center items-center">
                      <img 
                        src={sourcePreview} 
                        alt="预览图" 
                        className="max-h-[300px] max-w-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      原始尺寸: {originalWidth} × {originalHeight} 像素
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      更换图片
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 尺寸调整设置 */}
            <Card>
              <CardHeader>
                <CardTitle>尺寸设置</CardTitle>
                <CardDescription>设置目标尺寸和调整选项</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 预设尺寸选择 */}
                  <div className="space-y-2">
                    <Label>预设尺寸</Label>
                    <Select value={selectedPreset} onValueChange={handlePresetChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择预设尺寸" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {presets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 调整模式选择 */}
                  <div className="space-y-2">
                    <Label>调整模式</Label>
                    <Select value={resizeMode} onValueChange={(value) => setResizeMode(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择调整模式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">精确尺寸</SelectItem>
                        <SelectItem value="percentage">百分比缩放</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 精确尺寸设置 */}
                  {resizeMode === 'exact' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">宽度 (像素)</Label>
                        <Input
                          id="width"
                          value={width}
                          onChange={handleWidthChange}
                          placeholder="输入宽度"
                          type="number"
                          min="1"
                          disabled={!sourceFile}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">高度 (像素)</Label>
                        <Input
                          id="height"
                          value={height}
                          onChange={handleHeightChange}
                          placeholder="输入高度"
                          type="number"
                          min="1"
                          disabled={!sourceFile}
                        />
                      </div>
                    </div>
                  )}

                  {/* 百分比缩放设置 */}
                  {resizeMode === 'percentage' && (
                    <div className="space-y-2">
                      <Label htmlFor="percentage">缩放比例: {percentage}%</Label>
                      <Input
                        id="percentage"
                        value={percentage}
                        onChange={handlePercentageChange}
                        type="range"
                        min="10"
                        max="200"
                        className="w-full"
                        disabled={!sourceFile}
                      />
                    </div>
                  )}

                  {/* 高级选项 */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">高级选项</h3>
                    
                    {/* 保持宽高比 */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="preserveAspectRatio">保持宽高比</Label>
                      <Switch 
                        id="preserveAspectRatio"
                        checked={preserveAspectRatio}
                        onCheckedChange={setPreserveAspectRatio}
                        disabled={!sourceFile}
                      />
                    </div>

                    {/* 输出格式 */}
                    <div className="space-y-2">
                      <Label htmlFor="outputFormat">输出格式</Label>
                      <Select 
                        value={outputFormat} 
                        onValueChange={(value) => setOutputFormat(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择输出格式" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">自动（保持原格式）</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="webp">WebP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 质量设置 */}
                    <div className="space-y-2">
                      <Label htmlFor="quality">图片质量: {quality}%</Label>
                      <Input
                        id="quality"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        type="range"
                        min="1"
                        max="100"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleResize}
                  disabled={!sourceFile || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      调整尺寸
                    </>
                  )}
                </Button>
                
                {processedBlob && (
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载调整后的图片
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      className="w-full"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          复制到剪贴板
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* 处理结果预览 */}
            {processedPreview && (
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>处理结果预览</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSizeInfo(!showSizeInfo)}
                    className="h-8 gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>文件信息</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 flex justify-center items-center">
                    <img 
                      src={processedPreview} 
                      alt="调整后预览图" 
                      className="max-h-[400px] max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="mt-4 text-center text-gray-600">
                    调整后尺寸: {width} × {height} 像素
                  </div>
                  
                  {/* 文件大小信息 */}
                  {showSizeInfo && (
                    (() => {
                      const sizeInfo = calculateSizeInfo();
                      if (!sizeInfo) return null;
                      
                      return (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">文件大小变化</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">原始大小:</span> {sizeInfo.originalSizeMB} MB
                            </div>
                            <div>
                              <span className="text-gray-500">新文件大小:</span> {sizeInfo.newSizeMB} MB
                            </div>
                            <div className="col-span-2">
                              <span className={`font-medium ${sizeInfo.isReduced ? 'text-green-600' : 'text-red-600'}`}>
                                {(parseFloat(sizeInfo.sizeDiff) || 0) > 0 ? '+' : ''}{sizeInfo.sizeDiff} MB ({(parseFloat(sizeInfo.percentageChange) || 0) > 0 ? '+' : ''}{sizeInfo.percentageChange}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
