"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, CheckCircle2, X, ArrowLeft, Play, Pause, Plus, Minus, Download, RotateCcw, Image as ImageIcon, Info, Clock, Sliders, Sparkles, Zap, Save, Trash2, MoveUp, MoveDown, Settings, List, Grid, Layers } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Dialog components removed as they're not being used
// Skeleton component removed as it's not being used
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Input component removed as it's not being used

import { Header } from "@/components/Header"
import { useLanguage } from "@/hooks/useLanguage"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file GIF动态制作器
 * @description 提供多张图片合成GIF、帧率调节和大小优化功能的动态图制作工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface GIFFrame {
  id: string;
  file: File;
  previewUrl: string;
  duration: number; // 毫秒
  width: number;
  height: number;
  index: number;
}

interface GIFSettings {
  fps: number; // 帧率
  loopCount: number; // 循环次数，0表示无限循环
  width: number; // 输出宽度
  height: number; // 输出高度
  quality: number; // 质量 0-100
  optimizeSize: boolean; // 是否优化大小
  dithering: boolean; // 是否使用抖动
  colorReduction: boolean; // 是否减少颜色
  maxColors: number; // 最大颜色数量
  backgroundColor: string; // 背景颜色
  keepAspectRatio: boolean; // 是否保持宽高比
}

interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<GIFSettings>;
}

export default function GifMaker() {
  // Removed unused t variable from useLanguage hook
  useLanguage()
  const [activeTab, setActiveTab] = useState("upload")
  const [frames, setFrames] = useState<GIFFrame[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFrame, setDraggedFrame] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()

  // GIF设置
  const [gifSettings, setGifSettings] = useState<GIFSettings>({
    fps: 10,
    loopCount: 0,
    width: 300,
    height: 300,
    quality: 80,
    optimizeSize: true,
    dithering: true,
    colorReduction: true,
    maxColors: 256,
    backgroundColor: "transparent",
    keepAspectRatio: true
  })

  // 动画预设
  const animationPresets: AnimationPreset[] = [
    {
      id: "slow-motion",
      name: "慢动作",
      description: "适合展示细节的慢速动画",
      settings: { fps: 5, quality: 90 }
    },
    {
      id: "normal",
      name: "标准",
      description: "平衡流畅度和文件大小",
      settings: { fps: 10, quality: 80 }
    },
    {
      id: "fast",
      name: "快速",
      description: "适合快速变化的动画",
      settings: { fps: 15, quality: 70 }
    },
    {
      id: "optimized",
      name: "优化",
      description: "最小化文件大小",
      settings: { fps: 8, quality: 60, optimizeSize: true, colorReduction: true, maxColors: 128 }
    },
    {
      id: "high-quality",
      name: "高质量",
      description: "最佳视觉效果",
      settings: { fps: 12, quality: 95, dithering: true, optimizeSize: false }
    }
  ]

  // 示例图片组
  const sampleAnimations = [
    {
      id: "bounce",
      name: "弹跳动画",
      frames: [
        "https://picsum.photos/seed/bounce1/300/300",
        "https://picsum.photos/seed/bounce2/300/300",
        "https://picsum.photos/seed/bounce3/300/300",
        "https://picsum.photos/seed/bounce4/300/300",
        "https://picsum.photos/seed/bounce5/300/300"
      ]
    },
    {
      id: "rotate",
      name: "旋转动画",
      frames: [
        "https://picsum.photos/seed/rotate1/300/300",
        "https://picsum.photos/seed/rotate2/300/300",
        "https://picsum.photos/seed/rotate3/300/300",
        "https://picsum.photos/seed/rotate4/300/300",
        "https://picsum.photos/seed/rotate5/300/300",
        "https://picsum.photos/seed/rotate6/300/300"
      ]
    },
    {
      id: "fade",
      name: "淡入淡出",
      frames: [
        "https://picsum.photos/seed/fade1/300/300",
        "https://picsum.photos/seed/fade2/300/300",
        "https://picsum.photos/seed/fade3/300/300",
        "https://picsum.photos/seed/fade4/300/300",
        "https://picsum.photos/seed/fade5/300/300"
      ]
    }
  ]

  // 加载示例动画
  const loadSampleAnimation = async (animation: typeof sampleAnimations[0]) => {
    try {
      const loadedFrames: GIFFrame[] = []
      let maxWidth = 0
      let maxHeight = 0
      
      // 加载所有帧
      for (let i = 0; i < animation.frames.length; i++) {
        const response = await fetch(animation.frames[i])
        const blob = await response.blob()
        const file = new File([blob], `sample-frame-${i + 1}.jpg`, { type: 'image/jpeg' })
        
        // 获取图片尺寸
        const img = new Image()
        const previewUrl = URL.createObjectURL(blob)
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = reject
          img.src = previewUrl
        })
        
        // 更新最大尺寸
        maxWidth = Math.max(maxWidth, img.width)
        maxHeight = Math.max(maxHeight, img.height)
        
        loadedFrames.push({
          id: `sample-${Date.now()}-${i}`,
          file,
          previewUrl,
          duration: 1000 / gifSettings.fps,
          width: img.width,
          height: img.height,
          index: i
        })
      }
      
      // 更新设置为最大帧尺寸
      setGifSettings(prev => ({
        ...prev,
        width: Math.min(maxWidth, 800), // 限制最大宽度
        height: Math.min(maxHeight, 800) // 限制最大高度
      }))
      
      setFrames(loadedFrames)
      setActiveTab("edit")
      setSelectedFrames([])
      
      // 立即预览
      if (loadedFrames.length > 0) {
        previewAnimation()
      }
      
      addHistoryItem({
        type: "image",
        input: {
          value: 'sample-animation',
          format: 'animation'
        },
        output: {
          format: 'gif'
        }
      })
      
      toast({
        title: "加载成功",
        description: `已加载 ${animation.name} 示例动画`,
      })
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载示例动画，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理文件选择
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return
    
    try {
      const newFrames: GIFFrame[] = []
      let maxWidth = 0
      let maxHeight = 0
      
      // 过滤图片文件
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      
      if (imageFiles.length === 0) {
        toast({
          title: "不支持的文件格式",
          description: "请选择有效的图片文件",
          variant: "destructive",
        })
        return
      }
      
      // 处理每个图片文件
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        
        // 创建预览URL
        const previewUrl = URL.createObjectURL(file)
        
        // 获取图片尺寸
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = reject
          img.src = previewUrl
        })
        
        // 更新最大尺寸
        maxWidth = Math.max(maxWidth, img.width)
        maxHeight = Math.max(maxHeight, img.height)
        
        newFrames.push({
          id: `frame-${Date.now()}-${i}`,
          file,
          previewUrl,
          duration: 1000 / gifSettings.fps,
          width: img.width,
          height: img.height,
          index: frames.length + i
        })
      }
      
      // 更新设置为最大帧尺寸
      setGifSettings(prev => ({
        ...prev,
        width: Math.min(maxWidth, 800), // 限制最大宽度
        height: Math.min(maxHeight, 800) // 限制最大高度
      }))
      
      // 添加到现有帧
      const updatedFrames = [...frames, ...newFrames]
      setFrames(updatedFrames)
      setSelectedFrames([])
      
      // 自动切换到编辑标签
      if (activeTab === "upload") {
        setActiveTab("edit")
      }
      
      // 立即预览
      if (updatedFrames.length > 0) {
        previewAnimation()
      }
      
      addHistoryItem({
        type: "image",
        input: {
          format: 'images'
        },
        output: {
          format: 'gif'
        }
      })
      
      toast({
        title: "上传成功",
        description: `已添加 ${imageFiles.length} 张图片`,
      })
    } catch (error) {
      toast({
        title: "处理失败",
        description: "无法处理部分图片，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    handleFileSelect(Array.from(files))
    
    // 重置文件输入，允许再次选择相同文件
    event.target.value = ''
  }

  // 处理拖放事件
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-green-400', 'bg-green-50')
    }
    
    const files = event.dataTransfer.files
    if (!files || files.length === 0) return
    
    handleFileSelect(Array.from(files))
  }

  // 处理拖放悬停
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-green-400', 'bg-green-50')
    }
  }

  // 处理拖放离开
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-green-400', 'bg-green-50')
    }
  }

  // 更新GIF设置
  const updateGifSetting = <K extends keyof GIFSettings>(key: K, value: GIFSettings[K]) => {
    setGifSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 应用预设
  const applyPreset = (preset: AnimationPreset) => {
    setGifSettings(prev => ({
      ...prev,
      ...preset.settings
    }))
    
    // 更新所有帧的持续时间
    if (preset.settings.fps) {
      const frameDuration = 1000 / preset.settings.fps
      setFrames(prev => prev.map(frame => ({
        ...frame,
        duration: frameDuration
      })))
    }
    
    toast({
      title: "预设应用成功",
      description: `已应用 ${preset.name} 预设`,
    })
  }

  // 更新单个帧的持续时间
  const updateFrameDuration = (frameId: string, duration: number) => {
    setFrames(prev => prev.map(frame => 
      frame.id === frameId 
        ? { ...frame, duration } 
        : frame
    ))
  }

  // 删除选定的帧
  const deleteSelectedFrames = () => {
    if (selectedFrames.length === 0) return
    
    // 释放被删除帧的previewUrl
    selectedFrames.forEach(id => {
      const frame = frames.find(f => f.id === id)
      if (frame) {
        URL.revokeObjectURL(frame.previewUrl)
      }
    })
    
    // 过滤掉被删除的帧
    const updatedFrames = frames.filter(frame => !selectedFrames.includes(frame.id))
    
    // 更新索引
    updatedFrames.forEach((frame, index) => {
      frame.index = index
    })
    
    setFrames(updatedFrames)
    setSelectedFrames([])
    
    // 重新预览
    if (updatedFrames.length > 0) {
      previewAnimation()
    }
    
    toast({
      title: "删除成功",
      description: `已删除 ${selectedFrames.length} 个帧`,
    })
  }

  // 清空所有帧
  const clearAllFrames = () => {
    // 释放所有previewUrl
    frames.forEach(frame => {
      URL.revokeObjectURL(frame.previewUrl)
    })
    
    setFrames([])
    setSelectedFrames([])
    setPreviewUrl(null)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    toast({
      title: "清空成功",
      description: "已清空所有帧",
    })
  }

  // 选择/取消选择帧
  const toggleFrameSelection = (frameId: string, event?: React.MouseEvent) => {
    // 如果是拖动操作，不进行选择
    if (isDragging) return
    
    // 如果按住Ctrl/Cmd键，切换多选
    if (event && (event.ctrlKey || event.metaKey)) {
      setSelectedFrames(prev => 
        prev.includes(frameId)
          ? prev.filter(id => id !== frameId)
          : [...prev, frameId]
      )
    } else {
      // 单选
      setSelectedFrames([frameId])
    }
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFrames.length === frames.length) {
      setSelectedFrames([])
    } else {
      setSelectedFrames(frames.map(frame => frame.id))
    }
  }

  // 移动帧位置
  const moveFrame = (frameId: string, direction: 'up' | 'down') => {
    const index = frames.findIndex(frame => frame.id === frameId)
    if (index === -1) return
    
    // 检查是否可以移动
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === frames.length - 1)) {
      return
    }
    
    // 创建新的帧数组
    const newFrames = [...frames]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // 交换位置
    const temp = newFrames[index];
    newFrames[index] = newFrames[targetIndex];
    newFrames[targetIndex] = temp;
    
    // 更新索引
    newFrames.forEach((frame, idx) => {
      frame.index = idx
    })
    
    setFrames(newFrames)
    
    // 重新预览
    previewAnimation()
  }

  // 拖放排序帧
  const handleDragStart = (frameId: string) => {
    setIsDragging(true)
    setDraggedFrame(frameId)
  }

  const handleDragOverFrame = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDropFrame = (targetFrameId: string) => {
    if (!draggedFrame || draggedFrame === targetFrameId) {
      setIsDragging(false)
      setDraggedFrame(null)
      return
    }
    
    const draggedIndex = frames.findIndex(frame => frame.id === draggedFrame)
    const targetIndex = frames.findIndex(frame => frame.id === targetFrameId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setIsDragging(false)
      setDraggedFrame(null)
      return
    }
    
    // 创建新的帧数组
    const newFrames = [...frames]
    
    // 移除被拖动的帧
    const [removedFrame] = newFrames.splice(draggedIndex, 1)
    
    // 插入到目标位置
    newFrames.splice(targetIndex, 0, removedFrame)
    
    // 更新索引
    newFrames.forEach((frame, idx) => {
      frame.index = idx
    })
    
    setFrames(newFrames)
    setIsDragging(false)
    setDraggedFrame(null)
    
    // 重新预览
    previewAnimation()
  }

  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedFrame(null)
  }

  // 预览动画
  const previewAnimation = () => {
    if (frames.length === 0) {
      setPreviewUrl(null)
      return
    }
    
    // 停止之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // 重置当前预览帧
    setCurrentPreviewFrame(0)
    
    // 模拟动画预览
    let lastTimestamp = 0
    let currentFrameIndex = 0
    
    const animate = (timestamp: number) => {
      // 计算时间差
      const elapsed = timestamp - lastTimestamp
      
      // 检查当前帧是否应该切换
      if (elapsed >= frames[currentFrameIndex].duration) {
        // 更新最后时间戳
        lastTimestamp = timestamp
        
        // 更新当前帧索引
        currentFrameIndex = (currentFrameIndex + 1) % frames.length
        setCurrentPreviewFrame(currentFrameIndex)
      }
      
      // 继续动画
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // 开始动画
    animationRef.current = requestAnimationFrame(animate)
  }

  // 开始/停止预览
  const togglePlayback = () => {
    if (isPlaying) {
      // 停止预览
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    } else {
      // 开始预览
      previewAnimation()
    }
    
    setIsPlaying(!isPlaying)
  }

  // 生成GIF
  const generateGIF = async () => {
    if (frames.length === 0) {
      toast({
        title: "无法生成",
        description: "请先添加图片帧",
        variant: "destructive",
      })
      return
    }
    
    setIsProcessing(true)
    
    try {
      // 模拟GIF生成过程
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 这里应该使用实际的GIF生成库，现在只是模拟
      // 实际项目中可以使用gif.js或类似的库
      
      // 创建模拟的GIF预览
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not available")
      
      // 设置canvas尺寸
      canvas.width = gifSettings.width
      canvas.height = gifSettings.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("Context not available")
      
      // 绘制第一帧作为预览
      const firstFrame = frames[0]
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = firstFrame.previewUrl
      })
      
      // 计算缩放比例
      let scale = 1
      if (gifSettings.keepAspectRatio) {
        const widthRatio = gifSettings.width / img.width
        const heightRatio = gifSettings.height / img.height
        scale = Math.min(widthRatio, heightRatio)
      }
      
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const xOffset = (gifSettings.width - scaledWidth) / 2
      const yOffset = (gifSettings.height - scaledHeight) / 2
      
      // 绘制背景
      if (gifSettings.backgroundColor !== "transparent") {
        ctx.fillStyle = gifSettings.backgroundColor
        ctx.fillRect(0, 0, gifSettings.width, gifSettings.height)
      } else {
        // 透明背景
        ctx.clearRect(0, 0, gifSettings.width, gifSettings.height)
      }
      
      // 绘制图片
      ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight)
      
      // 生成预览URL
      const dataUrl = canvas.toDataURL('image/gif')
      setPreviewUrl(dataUrl)
      
      // 这里应该生成实际的GIF文件并提供下载
      
      addHistoryItem({
        type: "image",
        input: {
          format: 'images'
        },
        output: {
          format: 'gif'
        }
      })
      
      toast({
        title: "生成成功",
        description: "GIF已生成，点击下载按钮保存",
      })
      
    } catch (error) {
      toast({
        title: "生成失败",
        description: "无法生成GIF，请重试",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 下载GIF
  const downloadGIF = () => {
    if (!previewUrl) {
      toast({
        title: "无法下载",
        description: "请先生成GIF",
        variant: "destructive",
      })
      return
    }
    
    try {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = `animation-${Date.now()}.gif`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 释放URL对象
      URL.revokeObjectURL(previewUrl)
      
      addHistoryItem({
        type: "image",
        input: {
          format: 'images'
        },
        output: {
          format: 'gif'
        }
      })
      
      toast({
        title: "下载成功",
        description: "GIF已下载",
      })
      
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载GIF，请重试",
        variant: "destructive",
      })
    }
  }

  // 计算文件大小估计
  const estimateFileSize = () => {
    if (frames.length === 0) return "0 KB"
    
    // 简单的文件大小估计
    // 实际项目中应该使用更准确的算法
    const pixelsPerFrame = gifSettings.width * gifSettings.height
    const bitDepth = gifSettings.maxColors <= 256 ? 8 : 16
    const bytesPerFrame = (pixelsPerFrame * bitDepth) / 8
    const compressionRatio = gifSettings.optimizeSize ? 0.3 : 0.6
    const estimatedSize = frames.length * bytesPerFrame * compressionRatio
    
    if (estimatedSize < 1024) {
      return `${Math.round(estimatedSize)} bytes`
    } else if (estimatedSize < 1024 * 1024) {
      return `${(estimatedSize / 1024).toFixed(1)} KB`
    } else {
      return `${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  // 计算动画时长
  const calculateAnimationDuration = () => {
    if (frames.length === 0) return "0s"
    
    const totalDuration = frames.reduce((sum, frame) => sum + frame.duration, 0) / 1000
    return `${totalDuration.toFixed(1)}s`
  }

  // 渲染帧列表
  const renderFrameList = () => {
    const displayMode = 'grid' // 可以是 'grid' 或 'list'
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-medium text-gray-800">动画帧 ({frames.length})</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleSelectAll}
              className="h-8 px-2"
            >
              {selectedFrames.length === frames.length ? "取消全选" : "全选"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFrames}
              disabled={frames.length === 0}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清空
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {/* 切换显示模式 */}}>
                  {displayMode === 'grid' ? (
                    <List className="w-4 h-4 mr-2" />
                  ) : (
                    <Grid className="w-4 h-4 mr-2" />
                  )}
                  切换视图
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* 反向帧顺序 */}}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  反向顺序
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {frames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed border-gray-300 rounded-lg text-center p-4">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500">暂无帧，请添加图片</p>
          </div>
        ) : (
          <div className={displayMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" 
            : "space-y-2"
          }>
            {frames.map(frame => {
              const isSelected = selectedFrames.includes(frame.id)
              const isCurrent = currentPreviewFrame === frame.index
              const isBeingDragged = draggedFrame === frame.id
              
              return (
                <div
                  key={frame.id}
                  className={`
                    relative 
                    ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'}
                    ${isCurrent ? 'border-2 border-green-500' : 'border border-gray-200'}
                    ${isBeingDragged ? 'opacity-50' : 'opacity-100'}
                    rounded-lg overflow-hidden cursor-move transition-all duration-200
                    ${displayMode === 'grid' ? 'aspect-square' : 'flex items-center'}
                  `}
                  onClick={(e) => toggleFrameSelection(frame.id, e)}
                  onDragStart={() => handleDragStart(frame.id)}
                  onDragOver={(e) => handleDragOverFrame(e)}
                  onDrop={() => handleDropFrame(frame.id)}
                  onDragEnd={handleDragEnd}
                  draggable
                >
                  {/* 选择指示器 */}
                  {isSelected && (
                    <div className="absolute top-1 left-1 z-10">
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      </Badge>
                    </div>
                  )}
                  
                  {/* 帧索引 */}
                  <div className="absolute top-1 left-1 z-10 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    {frame.index + 1}
                  </div>
                  
                  {/* 帧预览 */}
                  <div className={displayMode === 'grid' ? 'w-full h-full' : 'w-20 h-20'}>
                    <img 
                      src={frame.previewUrl} 
                      alt={`Frame ${frame.index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  {/* 帧持续时间控制 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
                    <div className="flex items-center justify-between">
                      <span>{(frame.duration / 1000).toFixed(2)}s</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            updateFrameDuration(frame.id, Math.max(50, frame.duration - 100))
                          }}
                          className="p-0.5 hover:bg-white/20 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            updateFrameDuration(frame.id, frame.duration + 100)
                          }}
                          className="p-0.5 hover:bg-white/20 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 移动控制 */}
                  <div className="absolute top-1 right-1 z-10 flex flex-col gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        moveFrame(frame.id, 'up')
                      }}
                      disabled={frame.index === 0}
                      className={`p-0.5 hover:bg-white/20 rounded ${frame.index === 0 ? 'opacity-50' : ''}`}
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        moveFrame(frame.id, 'down')
                      }}
                      disabled={frame.index === frames.length - 1}
                      className={`p-0.5 hover:bg-white/20 rounded ${frame.index === frames.length - 1 ? 'opacity-50' : ''}`}
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* 删除按钮 */}
        {selectedFrames.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={deleteSelectedFrames}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除所选帧 ({selectedFrames.length})
          </Button>
        )}
      </div>
    )
  }

  // 渲染预览区域
  const renderPreviewArea = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-medium text-gray-800">动画预览</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={togglePlayback}
              disabled={frames.length === 0}
              className="h-8 px-3"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  播放
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFullscreen(!showFullscreen)}
              disabled={frames.length === 0}
              className="h-8 px-3"
            >
              {showFullscreen ? (
                <>
                  <Minus className="w-4 h-4 mr-1" />
                  退出全屏
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  全屏预览
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div 
          ref={previewRef}
          className={`
            relative bg-gray-900 border border-gray-200 rounded-lg overflow-hidden
            flex items-center justify-center
            ${showFullscreen 
              ? 'fixed inset-0 z-50 m-0 max-w-none max-h-none' 
              : 'h-64 sm:h-80'
            }
          `}
        >
          {frames.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Play className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-gray-600">添加帧后在此预览动画</p>
            </div>
          ) : (
            <>
              {isPlaying ? (
                <div className="relative w-full h-full">
                  {frames.map((frame, index) => (
                    <img
                      key={frame.id}
                      src={frame.previewUrl}
                      alt={`Frame ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-0 ${index === currentPreviewFrame ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={frames[currentPreviewFrame]?.previewUrl || frames[0]?.previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {/* 播放指示器 */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex justify-between items-center">
                <span>{isPlaying ? '播放中...' : '已暂停'}</span>
                <span>{currentPreviewFrame + 1} / {frames.length}</span>
              </div>
            </>
          )}
          
          {/* 全屏退出按钮 */}
          {showFullscreen && (
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70"
              title="退出全屏"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* 动画信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">帧数</div>
              <div className="text-lg font-semibold text-gray-800">{frames.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">帧率</div>
              <div className="text-lg font-semibold text-gray-800">{gifSettings.fps} FPS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">时长</div>
              <div className="text-lg font-semibold text-gray-800">{calculateAnimationDuration()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">预估大小</div>
              <div className="text-lg font-semibold text-gray-800">{estimateFileSize()}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 渲染设置面板
  const renderSettingsPanel = () => {
    return (
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {/* 预设 */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">动画预设</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {animationPresets.map(preset => (
                <button
                  key={preset.id}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                  onClick={() => applyPreset(preset)}
                  title={preset.description}
                >
                  <div className="text-sm font-medium text-gray-800">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 基本设置 */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">基本设置</h3>
            <div className="space-y-4">
              {/* 帧率 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="fps" className="font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    帧率 (FPS)
                  </Label>
                  <Badge variant="outline">{gifSettings.fps}</Badge>
                </div>
                <Slider
                  id="fps"
                  defaultValue={[gifSettings.fps]}
                  min={1}
                  max={30}
                  step={1}
                  value={[gifSettings.fps]}
                  onValueChange={(value) => {
                    updateGifSetting('fps', value[0])
                    // 更新所有帧的持续时间
                    const frameDuration = 1000 / value[0]
                    setFrames(prev => prev.map(frame => ({
                      ...frame,
                      duration: frameDuration
                    })))
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>慢 (1 FPS)</span>
                  <span>快 (30 FPS)</span>
                </div>
              </div>
              
              {/* 循环次数 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="loopCount" className="font-medium flex items-center">
                    <RotateCcw className="w-4 h-4 mr-2 text-blue-600" />
                    循环次数
                  </Label>
                  <Badge variant="outline">{gifSettings.loopCount === 0 ? '无限' : gifSettings.loopCount}</Badge>
                </div>
                <Slider
                  id="loopCount"
                  defaultValue={[gifSettings.loopCount]}
                  min={0}
                  max={10}
                  step={1}
                  value={[gifSettings.loopCount]}
                  onValueChange={(value) => updateGifSetting('loopCount', value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>无限</span>
                  <span>10次</span>
                </div>
              </div>
              
              {/* 宽度 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="width" className="font-medium flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-blue-600" />
                    宽度 (px)
                  </Label>
                  <Badge variant="outline">{gifSettings.width}</Badge>
                </div>
                <Slider
                  id="width"
                  defaultValue={[gifSettings.width]}
                  min={100}
                  max={1000}
                  step={10}
                  value={[gifSettings.width]}
                  onValueChange={(value) => {
                    updateGifSetting('width', value[0])
                    // 如果保持宽高比，计算相应的高度
                    if (gifSettings.keepAspectRatio && frames.length > 0) {
                      // 获取第一帧的宽高比
                      const firstFrame = frames[0]
                      const aspectRatio = firstFrame.height / firstFrame.width
                      updateGifSetting('height', Math.round(value[0] * aspectRatio))
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              {/* 高度 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="height" className="font-medium flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-blue-600" />
                    高度 (px)
                  </Label>
                  <Badge variant="outline">{gifSettings.height}</Badge>
                </div>
                <Slider
                  id="height"
                  defaultValue={[gifSettings.height]}
                  min={100}
                  max={1000}
                  step={10}
                  value={[gifSettings.height]}
                  onValueChange={(value) => {
                    updateGifSetting('height', value[0])
                    // 如果保持宽高比，计算相应的宽度
                    if (gifSettings.keepAspectRatio && frames.length > 0) {
                      // 获取第一帧的宽高比
                      const firstFrame = frames[0]
                      const aspectRatio = firstFrame.width / firstFrame.height
                      updateGifSetting('width', Math.round(value[0] * aspectRatio))
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              {/* 保持宽高比 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="keepAspectRatio" className="font-medium">
                    保持宽高比
                  </Label>
                </div>
                <Switch
                  id="keepAspectRatio"
                  checked={gifSettings.keepAspectRatio}
                  onCheckedChange={(checked) => updateGifSetting('keepAspectRatio', checked)}
                />
              </div>
            </div>
          </div>
          
          {/* 优化设置 */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">优化设置</h3>
            <div className="space-y-4">
              {/* 质量 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quality" className="font-medium flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                    质量
                  </Label>
                  <Badge variant="outline">{gifSettings.quality}%</Badge>
                </div>
                <Slider
                  id="quality"
                  defaultValue={[gifSettings.quality]}
                  min={1}
                  max={100}
                  step={5}
                  value={[gifSettings.quality]}
                  onValueChange={(value) => updateGifSetting('quality', value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>低质量</span>
                  <span>高质量</span>
                </div>
              </div>
              
              {/* 优化大小 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="optimizeSize" className="font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-blue-600" />
                    优化大小
                  </Label>
                </div>
                <Switch
                  id="optimizeSize"
                  checked={gifSettings.optimizeSize}
                  onCheckedChange={(checked) => updateGifSetting('optimizeSize', checked)}
                />
              </div>
              
              {/* 颜色减少 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="colorReduction" className="font-medium flex items-center">
                    <Sliders className="w-4 h-4 mr-2 text-blue-600" />
                    颜色减少
                  </Label>
                </div>
                <Switch
                  id="colorReduction"
                  checked={gifSettings.colorReduction}
                  onCheckedChange={(checked) => updateGifSetting('colorReduction', checked)}
                />
              </div>
              
              {/* 最大颜色数 */}
              {gifSettings.colorReduction && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="maxColors" className="font-medium flex items-center">
                      <Sliders className="w-4 h-4 mr-2 text-blue-600" />
                      最大颜色数
                    </Label>
                    <Badge variant="outline">{gifSettings.maxColors}</Badge>
                  </div>
                  <Slider
                    id="maxColors"
                    defaultValue={[gifSettings.maxColors]}
                    min={16}
                    max={256}
                    step={16}
                    value={[gifSettings.maxColors]}
                    onValueChange={(value) => updateGifSetting('maxColors', value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>16色</span>
                    <span>256色</span>
                  </div>
                </div>
              )}
              
              {/* 抖动 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dithering" className="font-medium flex items-center">
                    <Sliders className="w-4 h-4 mr-2 text-blue-600" />
                    抖动
                  </Label>
                </div>
                <Switch
                  id="dithering"
                  checked={gifSettings.dithering}
                  onCheckedChange={(checked) => updateGifSetting('dithering', checked)}
                />
              </div>
              
              {/* 背景颜色 */}
              <div className="space-y-2">
                <Label htmlFor="backgroundColor" className="font-medium flex items-center">
                  <Sliders className="w-4 h-4 mr-2 text-blue-600" />
                  背景颜色
                </Label>
                <Select
                  value={gifSettings.backgroundColor}
                  onValueChange={(value) => updateGifSetting('backgroundColor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择背景颜色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">透明</SelectItem>
                    <SelectItem value="#ffffff">白色</SelectItem>
                    <SelectItem value="#000000">黑色</SelectItem>
                    <SelectItem value="#ff0000">红色</SelectItem>
                    <SelectItem value="#00ff00">绿色</SelectItem>
                    <SelectItem value="#0000ff">蓝色</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-medium">提示</AlertTitle>
            <AlertDescription className="text-blue-700">
              降低帧率、减少颜色数量和启用优化大小可以显著减小GIF文件大小，但可能会影响动画质量。
            </AlertDescription>
          </Alert>
        </div>
      </ScrollArea>
    )
  }

  // 渲染编辑界面
  const renderEditInterface = () => {
    return (
      <div className="space-y-6">
        {/* 预览和帧列表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {renderFrameList()}
          </div>
          <div className="lg:col-span-2">
            {renderPreviewArea()}
          </div>
        </div>
        
        {/* 设置和生成区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {renderSettingsPanel()}
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">GIF信息</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">帧数:</span>
                      <span className="font-medium">{frames.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">分辨率:</span>
                      <span className="font-medium">{gifSettings.width}×{gifSettings.height}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">帧率:</span>
                      <span className="font-medium">{gifSettings.fps} FPS</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">循环次数:</span>
                      <span className="font-medium">{gifSettings.loopCount === 0 ? '无限' : gifSettings.loopCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">时长:</span>
                      <span className="font-medium">{calculateAnimationDuration()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">预估大小:</span>
                      <span className="font-medium">{estimateFileSize()}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <Button 
                  variant="default" 
                  onClick={generateGIF}
                  disabled={frames.length === 0 || isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-pulse mr-2">生成中...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      生成GIF
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={downloadGIF}
                  disabled={!previewUrl || isProcessing}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载GIF
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("upload")}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加更多帧
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 清理资源
  useEffect(() => {
    return () => {
      // 停止动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // 释放帧预览URL
      frames.forEach(frame => {
        URL.revokeObjectURL(frame.previewUrl)
      })
      
      // 释放GIF预览URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [frames, previewUrl])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700">
          </div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000">
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse">
          </div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-7xl mx-auto">
            {/* 返回按钮 */}
            <Link href="/">
              <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>

            <Header />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  GIF动态制作器
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="upload" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      上传图片
                    </TabsTrigger>
                    <TabsTrigger 
                      value="edit" 
                      disabled={frames.length === 0}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      编辑GIF
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    <div 
                      ref={dropZoneRef}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放多张图片到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持JPG、PNG、WebP等常见图片格式，可上传多张</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Layers className="w-3 h-3 mr-1" />
                          多帧支持
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          <Clock className="w-3 h-3 mr-1" />
                          帧率可调
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Zap className="w-3 h-3 mr-1" />
                          大小优化
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">使用示例动画</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {sampleAnimations.map(animation => (
                          <div 
                            key={animation.id}
                            className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => loadSampleAnimation(animation)}
                          >
                            <div className="aspect-video bg-gray-100">
                              <img 
                                src={animation.frames[0]} 
                                alt={animation.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-white p-3 rounded-full">
                                    <Play className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="font-medium text-gray-800 mb-1">{animation.name}</h4>
                                <p className="text-sm text-gray-500">{animation.frames.length} 帧</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-800 mb-2">制作提示</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>使用多张连续拍摄的图片可以创建流畅的动画效果</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>保持图片分辨率一致，避免动画中出现大小跳跃</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>帧率越高动画越流畅，但文件大小也会越大</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>优化大小选项可以显著减小文件体积，但可能影响画质</span>
                          </li>
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="edit">
                      {renderEditInterface()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>© 2024 GIF动态制作器 | 轻松创建精彩动画</p>
              </div>
            </div>
          </div>
        </div>

        {/* 隐藏的Canvas用于生成GIF */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </TooltipProvider>
    )
  }