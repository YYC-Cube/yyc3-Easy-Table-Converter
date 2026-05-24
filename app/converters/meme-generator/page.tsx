'use client';

import React, { useState, useRef, useCallback, ChangeEvent, DragEvent, useEffect } from 'react';
import { ImageIcon, Plus, Download, Upload, Trash, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * @description 表情包文本接口定义
 * @project YYC³ Easy Table Converter
 */
interface MemeText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

/**
 * @description 表情包模板接口定义
 * @project YYC³ Easy Table Converter
 */
interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  textPositions: Array<{ x: number; y: number; fontSize?: number }>;
}

/**
 * @description 字体选项接口
 * @project YYC³ Easy Table Converter
 */
interface FontOption {
  id: string;
  name: string;
}

/**
 * @description 默认表情包模板数据
 * @project YYC³ Easy Table Converter
 */
const DEFAULT_TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    imageUrl: 'https://picsum.photos/id/1/800/600',
    width: 800,
    height: 600,
    textPositions: [{ x: 100, y: 150 }, { x: 500, y: 150 }]
  },
  {
    id: 'distracted-boyfriend',
    name: '分心的男友',
    imageUrl: 'https://picsum.photos/id/2/800/600',
    width: 800,
    height: 600,
    textPositions: [{ x: 200, y: 50 }, { x: 600, y: 50 }, { x: 400, y: 500 }]
  },
  {
    id: 'thinking-upgrade',
    name: '思维升级',
    imageUrl: 'https://picsum.photos/id/3/800/600',
    width: 800,
    height: 600,
    textPositions: [{ x: 200, y: 150 }, { x: 500, y: 150 }, { x: 300, y: 450 }]
  },
  {
    id: 'change-my-mind',
    name: '改变我的想法',
    imageUrl: 'https://picsum.photos/id/4/800/600',
    width: 800,
    height: 600,
    textPositions: [{ x: 400, y: 500 }]
  },
  {
    id: 'two-buttons',
    name: '两个按钮',
    imageUrl: 'https://picsum.photos/id/5/800/600',
    width: 800,
    height: 600,
    textPositions: [{ x: 250, y: 400 }, { x: 550, y: 400 }]
  }
];

/**
 * @description 支持的字体列表
 * @project YYC³ Easy Table Converter
 */
const SUPPORTED_FONTS: FontOption[] = [
  { id: 'sans-serif', name: 'Sans Serif' },
  { id: 'serif', name: 'Serif' },
  { id: 'monospace', name: 'Monospace' },
  { id: 'cursive', name: 'Cursive' }
];

/**
 * @description 支持的文本颜色列表
 * @project YYC³ Easy Table Converter
 */
const SUPPORTED_COLORS = [
  { id: '#FFFFFF', name: '白色' },
  { id: '#000000', name: '黑色' },
  { id: '#FF0000', name: '红色' },
  { id: '#00FF00', name: '绿色' },
  { id: '#0000FF', name: '蓝色' },
  { id: '#FFFF00', name: '黄色' },
  { id: '#FF00FF', name: '粉色' },
  { id: '#00FFFF', name: '青色' }
];

/**
 * @description 空状态组件 - 当用户尚未选择模板或上传图片时显示
 * @project YYC³ Easy Table Converter
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full w-full p-8 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-primary dark:hover:border-primary">
    <EmptyStateIcon className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">开始创建表情包</h3>
    <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
      选择一个模板或者上传您自己的图片来创建自定义表情包
    </p>
    <div className="flex gap-3">
      <Button className="gap-2">
        <Plus size={18} />
        选择模板
      </Button>
      <Button variant="secondary" className="gap-2">
        <Upload size={18} />
        上传图片
      </Button>
    </div>
  </div>
);

/**
 * @description 空状态图标组件
 * @project YYC³ Easy Table Converter
 */
const EmptyStateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center">
      <ImageIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700 opacity-50" />
  </div>
);

/**
 * @description 表情包生成器主组件
 * @project YYC³ Easy Table Converter
 */
const MemeGenerator: React.FC = () => {
  // 状态管理
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [texts, setTexts] = useState<MemeText[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Refs
  const memeCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memePreviewRef = useRef<HTMLDivElement>(null);

  // 选择模板
  const handleSelectTemplate = useCallback((template: MemeTemplate) => {
    try {
      setSelectedTemplate(template);
      setCustomImage(null);
      setError(null);
      setSuccess('模板选择成功');
      
      // 为模板创建默认文本
      const defaultTexts: MemeText[] = template.textPositions.map((position, index) => ({
        id: `text-${Date.now()}-${index}`,
        text: `文本 ${index + 1}`,
        x: position.x,
        y: position.y,
        fontSize: position.fontSize || 36,
        color: '#FFFFFF',
        fontWeight: 'bold' as const,
        fontFamily: 'sans-serif',
        align: 'center' as const
      }));
      
      setTexts(defaultTexts);
      setSelectedTextId(defaultTexts.length > 0 ? defaultTexts[0].id : null);
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('选择模板时出错，请重试');
      console.error('选择模板错误:', err);
    }
  }, []);

  // 处理自定义图片上传
  const handleCustomImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = event.target.files?.[0];
      
      if (!file) {
        setError('请选择一个图片文件');
        return;
      }
      
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过10MB');
        return;
      }
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请上传有效的图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imageUrl = e.target?.result as string;
          setCustomImage(imageUrl);
          setSelectedTemplate(null);
          setSuccess('图片上传成功');
          
          // 为自定义图片创建默认文本
          const defaultText: MemeText = {
            id: `text-${Date.now()}`,
            text: '添加文本',
            x: 400, // 默认位置
            y: 300, // 默认位置
            fontSize: 36,
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            align: 'center'
          };
          
          setTexts([defaultText]);
          setSelectedTextId(defaultText.id);
          
          // 3秒后清除成功消息
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('处理图片时出错，请重试');
          console.error('处理图片错误:', err);
        }
      };
      
      reader.onerror = () => {
        setError('读取文件时出错，请重试');
      };
      
      reader.readAsDataURL(file);
      
      // 清除文件输入，允许重复上传相同文件
      event.target.value = '';
    } catch (err) {
      setError('上传图片时出错，请重试');
      console.error('上传图片错误:', err);
    }
  }, []);

  // 处理拖放事件 - 开始拖拽
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  // 处理拖放事件 - 拖拽经过
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // 处理拖放事件 - 拖拽离开
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // 只有当鼠标完全离开区域时才取消拖拽状态
    const rect = e.currentTarget.getBoundingClientRect();
    const isOutside = e.clientX < rect.left || 
                     e.clientX >= rect.right || 
                     e.clientY < rect.top || 
                     e.clientY >= rect.bottom;
    
    if (isOutside) {
      setIsDragging(false);
    }
    e.preventDefault();
  }, []);

  // 处理拖放事件 - 放置
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    try {
      e.preventDefault();
      setIsDragging(false);
      setError(null);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
          setError('图片大小不能超过10MB');
          return;
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          setError('请上传有效的图片文件');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imageUrl = event.target?.result as string;
            setCustomImage(imageUrl);
            setSelectedTemplate(null);
            setSuccess('图片上传成功');
            
            // 为自定义图片创建默认文本
            const defaultText: MemeText = {
              id: `text-${Date.now()}`,
              text: '添加文本',
              x: 400,
              y: 300,
              fontSize: 36,
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              align: 'center'
            };
            
            setTexts([defaultText]);
            setSelectedTextId(defaultText.id);
            
            // 3秒后清除成功消息
            setTimeout(() => setSuccess(null), 3000);
          } catch (err) {
            setError('处理图片时出错，请重试');
            console.error('处理拖放图片错误:', err);
          }
        };
        
        reader.onerror = () => {
          setError('读取文件时出错，请重试');
        };
        
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError('拖放文件时出错，请重试');
      console.error('拖放文件错误:', err);
    }
  }, []);

  // 开始拖拽文本
  const handleTextDragStart = useCallback((e: React.MouseEvent, textId: string) => {
    try {
      setIsDraggingText(true);
      setSelectedTextId(textId);
      
      if (memePreviewRef.current) {
        const canvasRect = memePreviewRef.current.getBoundingClientRect();
        const text = texts.find(t => t.id === textId);
        if (text) {
          const scale = zoom / 100;
          setDragOffset({
            x: e.clientX - canvasRect.left - text.x * scale,
            y: e.clientY - canvasRect.top - text.y * scale
          });
        }
      }
      
      // 防止文本选择
      e.preventDefault();
    } catch (err) {
      console.error('开始拖拽文本错误:', err);
    }
  }, [texts, zoom]);

  // 处理文本拖拽
  const handleTextDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingText || !selectedTextId || !memePreviewRef.current) return;
    
    try {
      const canvasRect = memePreviewRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      
      const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
      const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;
      
      // 边界检查，确保文本不会被拖出预览区域太远
      const safeX = Math.max(0, Math.min((selectedTemplate?.width || 800), newX));
      const safeY = Math.max(0, Math.min((selectedTemplate?.height || 600), newY));
      
      setTexts(prevTexts => prevTexts.map(text => 
        text.id === selectedTextId 
          ? { ...text, x: safeX, y: safeY }
          : text
      ));
    } catch (err) {
      console.error('拖拽文本错误:', err);
    }
  }, [isDraggingText, selectedTextId, dragOffset, zoom, selectedTemplate]);

  // 结束文本拖拽
  const handleTextDragEnd = useCallback(() => {
    setIsDraggingText(false);
  }, []);

  // 添加文本到表情包
  const addText = useCallback(() => {
    try {
      if (!selectedTemplate && !customImage) {
        setError('请先选择模板或上传图片');
        return;
      }
      
      const newText: MemeText = {
        id: `text-${Date.now()}`,
        text: '新文本',
        x: 400,
        y: 300,
        fontSize: 36,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        align: 'center'
      };
      
      setTexts(prev => [...prev, newText]);
      setSelectedTextId(newText.id);
      setSuccess('文本添加成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('添加文本时出错，请重试');
      console.error('添加文本错误:', err);
    }
  }, [selectedTemplate, customImage]);

  // 更新文本内容
  const updateTextContent = useCallback((textId: string, content: string) => {
    try {
      setTexts(prevTexts => prevTexts.map(text => 
        text.id === textId 
          ? { ...text, text: content }
          : text
      ));
    } catch (err) {
      console.error('更新文本内容错误:', err);
    }
  }, []);

  // 更新文本样式
  const updateTextStyle = useCallback((textId: string, style: Partial<MemeText>) => {
    try {
      setTexts(prevTexts => prevTexts.map(text => 
        text.id === textId 
          ? { ...text, ...style }
          : text
      ));
    } catch (err) {
      console.error('更新文本样式错误:', err);
    }
  }, []);

  // 删除文本
  const deleteText = useCallback((textId: string) => {
    try {
      const newTexts = texts.filter(text => text.id !== textId);
      setTexts(newTexts);
      
      if (selectedTextId === textId) {
        setSelectedTextId(newTexts.length > 0 ? newTexts[0].id : null);
      }
      
      setSuccess('文本删除成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('删除文本时出错，请重试');
      console.error('删除文本错误:', err);
    }
  }, [texts, selectedTextId]);

  // 下载表情包
  const downloadMeme = useCallback(async () => {
    try {
      if (!selectedTemplate && !customImage) {
        setError('请先选择模板或上传图片');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // 创建canvas并绘制内容
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      
      // 设置canvas尺寸
      const width = selectedTemplate?.width || 800;
      const height = selectedTemplate?.height || 600;
      canvas.width = width;
      canvas.height = height;
      
      // 加载图片并绘制
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous'; // 允许跨域图片
        image.src = selectedTemplate?.imageUrl || customImage || '';
        
        image.onload = () => {
          try {
            // 绘制背景图片
            ctx.drawImage(image, 0, 0, width, height);
            
            // 绘制文本
            texts.forEach(text => {
              // 设置字体样式
              ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
              ctx.fillStyle = text.color;
              ctx.textAlign = text.align;
              
              // 添加描边效果，增强可读性
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(1, text.fontSize / 15);
              ctx.lineJoin = 'round';
              ctx.strokeText(text.text, text.x, text.y);
              ctx.fillText(text.text, text.x, text.y);
            });
            
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        
        image.onerror = () => {
          reject(new Error('加载图片失败'));
        };
      });
      
      // 下载图片
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `meme-${Date.now()}.png`;
      link.href = dataUrl;
      
      // 模拟点击下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('表情包下载成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('下载表情包时出错，请重试');
      console.error('下载表情包错误:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate, customImage, texts]);

  // 清除当前工作（重置所有状态）
  const clearMeme = useCallback(() => {
    try {
      setSelectedTemplate(null);
      setCustomImage(null);
      setTexts([]);
      setSelectedTextId(null);
      setZoom(100);
      setSuccess('已清除当前工作');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('清除工作时出错，请重试');
      console.error('清除工作错误:', err);
    }
  }, []);

  // 处理错误信息显示超时
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (error) {
      timer = setTimeout(() => setError(null), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error]);

  // 设置鼠标事件监听
  useEffect(() => {
    if (isDraggingText) {
      window.addEventListener('mousemove', handleTextDrag);
      window.addEventListener('mouseup', handleTextDragEnd);
      
      // 防止页面滚动
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }
    
    return () => {
      window.removeEventListener('mousemove', handleTextDrag);
      window.removeEventListener('mouseup', handleTextDragEnd);
      
      // 恢复正常状态
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingText, handleTextDrag, handleTextDragEnd]);

  // 获取选中的文本
  const selectedText = texts.find(text => text.id === selectedTextId);
  
  // 获取当前图片源
  const currentImageSource = selectedTemplate?.imageUrl || customImage;
  
  // 获取当前尺寸
  const currentWidth = selectedTemplate?.width || 800;
  const currentHeight = selectedTemplate?.height || 600;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          表情包生成器
        </h1>
        
        {/* 错误和成功消息 */}
        {(error || success) && (
          <div className="mb-6 animate-fade-in">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-300">
                <Check className="h-4 w-4" />
                <AlertDescription className="ml-2">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧面板 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                选择模板
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEFAULT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`relative overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-gray-200 dark:ring-gray-700'}`}
                    aria-label={`选择模板: ${template.name}`}
                  >
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium px-2 py-1 rounded">
                        {template.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                自定义图片
              </h2>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                ref={memeCanvasRef}
              >
                {customImage ? (
                  <div className="relative">
                    <img
                      src={customImage}
                      alt="自定义图片"
                      className="max-h-40 mx-auto rounded"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomImage(null);
                        setTexts([]);
                        setSelectedTextId(null);
                        setSuccess('图片已移除');
                        setTimeout(() => setSuccess(null), 3000);
                      }}
                      className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 p-1 rounded-full shadow-md text-red-500 hover:text-red-600 transition-colors"
                      aria-label="移除图片"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      点击或拖拽图片到此处
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      支持 JPG、PNG、GIF (最大 10MB)
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleCustomImageUpload}
                      accept="image/*"
                      className="hidden"
                      aria-label="选择图片文件"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {currentImageSource && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  缩放控制
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <ZoomOut size={18} className="text-gray-500" />
                    <Slider
                      value={[zoom]}
                      min={50}
                      max={150}
                      step={5}
                      onValueChange={(value) => setZoom(value[0])}
                      aria-label="缩放控制"
                    />
                    <ZoomIn size={18} className="text-gray-500" />
                  </div>
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {zoom}%
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 中间区域 - 表情包编辑 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  编辑表情包
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={addText}
                    disabled={!selectedTemplate && !customImage}
                    variant="secondary"
                    className="gap-1"
                    aria-label="添加文本"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">添加文本</span>
                  </Button>
                  <Button
                    onClick={clearMeme}
                    disabled={!selectedTemplate && !customImage}
                    variant="secondary"
                    className="gap-1"
                    aria-label="清除"
                  >
                    <Trash size={16} />
                    <span className="hidden sm:inline">清除</span>
                  </Button>
                  <Button
                    onClick={downloadMeme}
                    disabled={(!selectedTemplate && !customImage) || isLoading}
                    className="gap-1"
                    aria-label="下载表情包"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        处理中...
                      </span>
                    ) : (
                      <>
                        <Download size={16} />
                        <span className="hidden sm:inline">下载</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {currentImageSource ? (
                  <div 
                    className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px] border border-gray-200 dark:border-gray-700"
                    ref={memePreviewRef}
                  >
                    <img
                      src={currentImageSource}
                      alt="表情包背景"
                      className="max-w-full max-h-[600px] transition-transform duration-200 ease-in-out"
                      style={{
                        width: `${currentWidth * (zoom / 100)}px`,
                        height: `${currentHeight * (zoom / 100)}px`,
                        objectFit: 'contain'
                      }}
                    />
                    
                    {/* 渲染文本层 */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        width: `${currentWidth * (zoom / 100)}px`,
                        height: `${currentHeight * (zoom / 100)}px`,
                        transformOrigin: 'center center'
                      }}
                    >
                      {texts.map((text) => (
                        <div
                          key={text.id}
                          className={`absolute pointer-events-auto cursor-move ${selectedTextId === text.id ? 'ring-2 ring-primary rounded' : ''}`}
                          style={{
                            left: `${text.x * (zoom / 100)}px`,
                            top: `${text.y * (zoom / 100)}px`,
                            transform: 'translate(-50%, -50%)',
                            userSelect: isDraggingText ? 'none' : 'auto'
                          }}
                          onClick={() => setSelectedTextId(text.id)}
                          onMouseDown={(e) => handleTextDragStart(e, text.id)}
                        >
                          <div 
                            className="text-shadow-sm break-words max-w-[300px]"
                            style={{
                              fontSize: `${text.fontSize * (zoom / 100)}px`,
                              color: text.color,
                              fontWeight: text.fontWeight,
                              fontFamily: text.fontFamily,
                              textAlign: text.align,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                            }}
                          >
                            {text.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
            
            {/* 文本编辑面板 */}
            {selectedText && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  编辑文本
                </h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="text-content">文本内容</Label>
                    <Input
                      id="text-content"
                      value={selectedText.text}
                      onChange={(e) => updateTextContent(selectedText.id, e.target.value)}
                      placeholder="输入文本内容"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="font-family">字体</Label>
                      <Select
                        value={selectedText.fontFamily}
                        onValueChange={(value) => updateTextStyle(selectedText.id, { fontFamily: value })}
                      >
                        <SelectTrigger id="font-family">
                          <SelectValue placeholder="选择字体" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_FONTS.map(font => (
                            <SelectItem key={font.id} value={font.id}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="font-size">字体大小</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="font-size"
                          type="number"
                          value={selectedText.fontSize}
                          onChange={(e) => {
                            const size = parseInt(e.target.value);
                            if (!isNaN(size) && size > 0 && size <= 200) {
                              updateTextStyle(selectedText.id, { fontSize: size });
                            }
                          }}
                          className="w-full"
                        />
                        <span className="text-gray-500">px</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>字体颜色</Label>
                      <div className="flex flex-wrap gap-2">
                        {SUPPORTED_COLORS.map(color => (
                          <button
                            key={color.id}
                            className={`w-8 h-8 rounded-full transition-transform ${selectedText.color === color.id ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color.id }}
                            onClick={() => updateTextStyle(selectedText.id, { color: color.id })}
                            aria-label={`设置颜色为 ${color.name}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>字体粗细</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedText.fontWeight === 'normal' ? 'default' : 'secondary'}
                          onClick={() => updateTextStyle(selectedText.id, { fontWeight: 'normal' })}
                          className="flex-1"
                        >
                          普通
                        </Button>
                        <Button
                          variant={selectedText.fontWeight === 'bold' ? 'default' : 'secondary'}
                          onClick={() => updateTextStyle(selectedText.id, { fontWeight: 'bold' })}
                          className="flex-1"
                        >
                          粗体
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>文本对齐</Label>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedText.align === 'left' ? 'default' : 'secondary'}
                              onClick={() => updateTextStyle(selectedText.id, { align: 'left' })}
                              className="flex-1"
                              aria-label="左对齐"
                            >
                              <AlignLeft size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>左对齐</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedText.align === 'center' ? 'default' : 'secondary'}
                              onClick={() => updateTextStyle(selectedText.id, { align: 'center' })}
                              className="flex-1"
                              aria-label="居中对齐"
                            >
                              <AlignCenter size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>居中对齐</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedText.align === 'right' ? 'default' : 'secondary'}
                              onClick={() => updateTextStyle(selectedText.id, { align: 'right' })}
                              className="flex-1"
                              aria-label="右对齐"
                            >
                              <AlignRight size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>右对齐</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => deleteText(selectedText.id)}
                    className="w-full"
                    aria-label="删除文本"
                  >
                    <Trash size={16} className="mr-2" />
                    删除文本
                  </Button>
                </div>
              </div>
            )}
            
            {/* 提示信息 */}
            {currentImageSource && !selectedText && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  💡 提示：点击表情包中的文本进行编辑，或点击"添加文本"按钮添加新文本
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeGenerator;
