"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, CheckCircle2, AlertCircle, ArrowLeft, Download, Eye, Smile, Frown, Sparkles, Eraser, RotateCcw, Info, Heart, User, Palette, Filter } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
// Separator removed as it's not being used
import { Label } from "@/components/ui/label"
// Switch removed as it's not being used
// RadioGroup components removed as they're not being used
// Select components removed as they're not being used
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Dialog components removed as they're not being used
// Skeleton component removed as it's not being used

import { Header } from "@/components/Header"
import { useLanguage } from "@/hooks/useLanguage"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file 智能人脸编辑
 * @description 提供基础美颜功能、表情调整和实时预览效果的人脸编辑工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

// FaceFeature interface removed as it's not being used

interface ExpressionOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  intensity: number;
}

interface BeautyAdjustment {
  type: string;
  value: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
}

interface FaceEditResult {
  blob: Blob;
  previewUrl: string;
  adjustments: BeautyAdjustment[];
  expressions: ExpressionOption[];
  timestamp: number;
}

export default function FaceEditor() {
  // Removed unused t variable from useLanguage hook
  useLanguage()
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [faceDetectionProgress, setFaceDetectionProgress] = useState(0)
  const [activeTool, setActiveTool] = useState<string>("beauty")
  const [history, setHistory] = useState<FaceEditResult[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [selectedFormat] = useState('png')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceCanvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()

  // 美颜调整参数
  const [beautyAdjustments, setBeautyAdjustments] = useState<BeautyAdjustment[]>([
    {
      type: "smooth",
      value: 40,
      label: "磨皮",
      description: "平滑肌肤，减少皱纹",
      icon: <Eraser className="w-4 h-4" />,
      min: 0,
      max: 100,
      step: 1
    },
    {
      type: "whiten",
      value: 30,
      label: "美白",
      description: "提亮肤色",
      icon: <Sparkles className="w-4 h-4" />,
      min: 0,
      max: 100,
      step: 1
    },
    {
      type: "sharpen",
      value: 20,
      label: "锐化",
      description: "增强面部细节",
      icon: <Filter className="w-4 h-4" />,
      min: 0,
      max: 100,
      step: 1
    },
    {
      type: "brightness",
      value: 15,
      label: "亮度",
      description: "调整整体亮度",
      icon: <Sparkles className="w-4 h-4" />,
      min: -50,
      max: 50,
      step: 1
    },
    {
      type: "contrast",
      value: 10,
      label: "对比度",
      description: "调整对比度",
      icon: <Palette className="w-4 h-4" />,
      min: -50,
      max: 50,
      step: 1
    },
    {
      type: "saturation",
      value: 5,
      label: "饱和度",
      description: "调整色彩饱和度",
      icon: <Palette className="w-4 h-4" />,
      min: -50,
      max: 50,
      step: 1
    },
  ])

  // 表情调整选项
  const [expressions, setExpressions] = useState<ExpressionOption[]>([
    {
      id: "smile",
      name: "微笑",
      icon: <Smile className="w-4 h-4" />,
      description: "增加微笑程度",
      intensity: 0
    },
    {
      id: "angry",
      name: "生气",
      icon: <Frown className="w-4 h-4" />,
      description: "增加生气表情",
      intensity: 0
    },
    {
      id: "surprised",
      name: "惊讶",
      icon: <Frown className="w-4 h-4" />,
      description: "增加惊讶表情",
      intensity: 0
    },
    {
      id: "happy",
      name: "开心",
      icon: <Heart className="w-4 h-4" />,
      description: "增加开心表情",
      intensity: 0
    }
  ])

  // 预设美颜风格
  const beautyPresets = [
    { id: "natural", name: "自然", description: "自然清新的美颜效果" },
    { id: "glamorous", name: "魅力", description: "适合社交媒体的美颜效果" },
    { id: "elegant", name: "优雅", description: "端庄优雅的美颜效果" },
    { id: "korean", name: "韩系", description: "韩式清新美颜效果" },
    { id: "japanese", name: "日系", description: "日系甜美美颜效果" },
  ]

  // 示例人脸图片
  const sampleImages = [
    { id: "1", name: "女性肖像1", url: "https://picsum.photos/seed/woman1/300/400" },
    { id: "2", name: "男性肖像1", url: "https://picsum.photos/seed/man1/300/400" },
    { id: "3", name: "女性肖像2", url: "https://picsum.photos/seed/woman2/300/400" },
    { id: "4", name: "男性肖像2", url: "https://picsum.photos/seed/man2/300/400" },
  ]

  // 加载示例图片
  const loadSampleImage = async (sampleUrl: string) => {
    try {
      const response = await fetch(sampleUrl)
      const blob = await response.blob()
      const file = new File([blob], 'sample-face.jpg', { type: 'image/jpeg' })
      handleFileSelect(file)
      
      addHistoryItem({
        type: "image",
        input: {
          value: 'sample-image',
          format: 'image'
        },
        output: {
          format: 'image'
        }
      })
    } catch (error) {
      toast({
        title: "加载示例失败",
        description: "无法加载示例图片，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "不支持的文件格式",
        description: "请选择有效的图片文件",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setEditedPreviewUrl(url)
    setIsFaceDetected(false)
    setActiveTab("edit")
    setActiveTool("beauty")
    setHistory([])
    
    // 模拟人脸检测
    detectFaceInImage()
    
    addHistoryItem({
        type: "image",
        input: {
          fileName: file.name,
          format: 'image'
        },
        output: {
          format: 'image'
        }
      })
  }

  // 模拟人脸检测
  const detectFaceInImage = () => {
    setIsProcessing(true)
    setFaceDetectionProgress(0)
    
    // 模拟检测进度
    const totalSteps = 100
    const stepTime = 2000 / totalSteps // 2秒完成检测
    
    const progressInterval = setInterval(() => {
      setFaceDetectionProgress(prev => {
        if (prev >= totalSteps) {
          clearInterval(progressInterval)
          return totalSteps
        }
        return prev + 1
      })
    }, stepTime)
    
    // 模拟检测完成
    setTimeout(() => {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setIsFaceDetected(true)
      
      toast({
        title: "人脸检测成功",
        description: "已识别到面部特征，可以开始编辑",
      })
    }, 2000)
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    handleFileSelect(files[0])
    
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
    handleFileSelect(files[0])
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

  // 更新美颜参数
  const updateBeautyAdjustment = (type: string, value: number) => {
    setBeautyAdjustments(prev => 
      prev.map(adj => 
        adj.type === type ? { ...adj, value } : adj
      )
    )
    
    // 实时应用效果
    applyChanges()
  }

  // 更新表情强度
  const updateExpression = (id: string, intensity: number) => {
    setExpressions(prev => 
      prev.map(exp => 
        exp.id === id ? { ...exp, intensity } : exp
      )
    )
    
    // 实时应用效果
    applyChanges()
  }

  // 应用预设美颜风格
  const applyPreset = (presetId: string) => {
    let newAdjustments = [...beautyAdjustments]
    
    switch (presetId) {
      case 'natural':
        newAdjustments = newAdjustments.map(adj => ({
          ...adj,
          value: adj.type === 'smooth' ? 30 :
                adj.type === 'whiten' ? 20 :
                adj.type === 'sharpen' ? 15 :
                adj.type === 'brightness' ? 10 :
                adj.type === 'contrast' ? 5 :
                adj.type === 'saturation' ? 0 : adj.value
        }))
        break
      case 'glamorous':
        newAdjustments = newAdjustments.map(adj => ({
          ...adj,
          value: adj.type === 'smooth' ? 60 :
                adj.type === 'whiten' ? 40 :
                adj.type === 'sharpen' ? 25 :
                adj.type === 'brightness' ? 20 :
                adj.type === 'contrast' ? 15 :
                adj.type === 'saturation' ? 10 : adj.value
        }))
        break
      case 'elegant':
        newAdjustments = newAdjustments.map(adj => ({
          ...adj,
          value: adj.type === 'smooth' ? 45 :
                adj.type === 'whiten' ? 35 :
                adj.type === 'sharpen' ? 30 :
                adj.type === 'brightness' ? 15 :
                adj.type === 'contrast' ? 10 :
                adj.type === 'saturation' ? 5 : adj.value
        }))
        break
      case 'korean':
        newAdjustments = newAdjustments.map(adj => ({
          ...adj,
          value: adj.type === 'smooth' ? 55 :
                adj.type === 'whiten' ? 50 :
                adj.type === 'sharpen' ? 10 :
                adj.type === 'brightness' ? 25 :
                adj.type === 'contrast' ? 5 :
                adj.type === 'saturation' ? 15 : adj.value
        }))
        break
      case 'japanese':
        newAdjustments = newAdjustments.map(adj => ({
          ...adj,
          value: adj.type === 'smooth' ? 40 :
                adj.type === 'whiten' ? 45 :
                adj.type === 'sharpen' ? 20 :
                adj.type === 'brightness' ? 20 :
                adj.type === 'contrast' ? 8 :
                adj.type === 'saturation' ? 12 : adj.value
        }))
        break
    }
    
    setBeautyAdjustments(newAdjustments)
    
    // 应用效果
    applyChanges()
    
    toast({
      title: "预设应用成功",
      description: `已应用 ${beautyPresets.find(p => p.id === presetId)?.name} 风格`,
    })
  }

  // 应用美颜和表情调整
  const applyChanges = async () => {
    if (!previewUrl) return
    
    // 模拟实时处理
    const canvas = canvasRef.current
    if (!canvas) return
    
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = previewUrl
    })
    
    // 设置canvas尺寸
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 绘制原图
    ctx.drawImage(img, 0, 0)
    
    // 应用美颜效果（模拟）
    applyBeautyEffects(ctx, canvas.width, canvas.height)
    
    // 应用表情效果（模拟）
    applyExpressionEffects(ctx, canvas.width, canvas.height)
    
    // 生成预览URL
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Failed to create blob")),
        selectedFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        0.9
      )
    })
    
    // 更新预览URL
    if (editedPreviewUrl) {
      URL.revokeObjectURL(editedPreviewUrl)
    }
    
    const newPreviewUrl = URL.createObjectURL(blob)
    setEditedPreviewUrl(newPreviewUrl)
  }

  // 应用美颜效果（模拟）
  const applyBeautyEffects = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 获取当前美颜参数
    const smooth = beautyAdjustments.find(a => a.type === 'smooth')?.value || 0
    const whiten = beautyAdjustments.find(a => a.type === 'whiten')?.value || 0
    const sharpen = beautyAdjustments.find(a => a.type === 'sharpen')?.value || 0
    const brightness = beautyAdjustments.find(a => a.type === 'brightness')?.value || 0
    const contrast = beautyAdjustments.find(a => a.type === 'contrast')?.value || 0
    const saturation = beautyAdjustments.find(a => a.type === 'saturation')?.value || 0
    
    // 模拟美颜效果 - 实际实现中应该使用更复杂的图像处理算法
    ctx.save()
    
    // 应用亮度和对比度调整
    if (brightness !== 0 || contrast !== 0) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(brightness) / 200})`
      ctx.fillRect(0, 0, width, height)
    }
    
    // 应用饱和度调整（模拟）
    if (saturation !== 0) {
      ctx.globalCompositeOperation = 'color'
      ctx.fillStyle = saturation > 0 ? `rgba(255, 255, 255, ${saturation / 200})` : `rgba(0, 0, 0, ${Math.abs(saturation) / 200})`
      ctx.fillRect(0, 0, width, height)
    }
    
    // 应用磨皮效果（模拟）- 在实际应用中应该使用高斯模糊和遮罩
    if (smooth > 0) {
      ctx.globalCompositeOperation = 'soft-light'
      ctx.fillStyle = `rgba(255, 255, 255, ${smooth / 200})`
      ctx.fillRect(0, 0, width, height)
    }
    
    // 应用美白效果（模拟）
    if (whiten > 0) {
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = `rgba(255, 245, 235, ${whiten / 200})`
      ctx.fillRect(0, 0, width, height)
    }
    
    // 应用锐化效果（模拟）
    if (sharpen > 0) {
      ctx.globalCompositeOperation = 'hard-light'
      ctx.fillStyle = `rgba(0, 0, 0, ${sharpen / 200})`
      ctx.fillRect(0, 0, width, height)
    }
    
    ctx.restore()
  }

  // 应用表情效果（模拟）
  const applyExpressionEffects = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 获取表情强度
    const smileIntensity = expressions.find(e => e.id === 'smile')?.intensity || 0
    const angryIntensity = expressions.find(e => e.id === 'angry')?.intensity || 0
    const surprisedIntensity = expressions.find(e => e.id === 'surprised')?.intensity || 0
    const happyIntensity = expressions.find(e => e.id === 'happy')?.intensity || 0
    
    // 模拟表情效果 - 在实际应用中应该使用面部关键点检测和变形
    if (smileIntensity > 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = `rgba(255, 250, 240, ${smileIntensity / 100})`
      // 模拟在嘴部区域绘制效果
      ctx.fillRect(width / 3, height / 2, width / 3, height / 4)
      ctx.restore()
    }
    
    if (angryIntensity > 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'color-dodge'
      ctx.fillStyle = `rgba(255, 200, 200, ${angryIntensity / 100})`
      // 模拟在眉毛区域绘制效果
      ctx.fillRect(width / 4, height / 4, width / 2, height / 6)
      ctx.restore()
    }
    
    if (surprisedIntensity > 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = `rgba(220, 230, 255, ${surprisedIntensity / 100})`
      // 模拟在眼睛和嘴部区域绘制效果
      ctx.fillRect(width / 3, height / 3, width / 3, height / 3)
      ctx.restore()
    }
    
    if (happyIntensity > 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'soft-light'
      ctx.fillStyle = `rgba(255, 240, 220, ${happyIntensity / 100})`
      // 模拟在脸颊区域绘制效果
      ctx.fillRect(width / 5, height / 2, width / 5, height / 4)
      ctx.fillRect(width * 3 / 5, height / 2, width / 5, height / 4)
      ctx.restore()
    }
  }

  // 保存当前编辑状态到历史记录
  const saveToHistory = () => {
    if (!editedPreviewUrl) return
    
    // 创建blob并生成预览URL
    fetch(editedPreviewUrl)
      .then(response => response.blob())
      .then(blob => {
        const result: FaceEditResult = {
          blob,
          previewUrl: URL.createObjectURL(blob),
          adjustments: [...beautyAdjustments],
          expressions: [...expressions],
          timestamp: Date.now()
        }
        
        setHistory(prev => [result, ...prev.slice(0, 4)]) // 保留最近5次历史
      })
  }

  // 从历史记录恢复编辑状态
  const restoreFromHistory = (result: FaceEditResult) => {
    setBeautyAdjustments([...result.adjustments])
    setExpressions([...result.expressions])
    
    if (editedPreviewUrl) {
      URL.revokeObjectURL(editedPreviewUrl)
    }
    
    setEditedPreviewUrl(result.previewUrl)
    
    toast({
      title: "恢复编辑状态",
      description: "已从历史记录恢复编辑状态",
    })
  }

  // 重置所有编辑
  const resetAllChanges = () => {
    // 重置美颜参数
    setBeautyAdjustments(beautyAdjustments.map(adj => ({
      ...adj,
      value: adj.type === 'smooth' ? 40 :
             adj.type === 'whiten' ? 30 :
             adj.type === 'sharpen' ? 20 :
             adj.type === 'brightness' ? 15 :
             adj.type === 'contrast' ? 10 :
             adj.type === 'saturation' ? 5 : adj.value
    })))
    
    // 重置表情参数
    setExpressions(expressions.map(exp => ({ ...exp, intensity: 0 })))
    
    // 恢复原始预览
    if (previewUrl) {
      if (editedPreviewUrl && editedPreviewUrl !== previewUrl) {
        URL.revokeObjectURL(editedPreviewUrl)
      }
      setEditedPreviewUrl(previewUrl)
    }
    
    toast({
      title: "重置成功",
      description: "所有编辑已重置为初始状态",
    })
  }

  // 下载编辑后的图片
  const downloadImage = async () => {
    if (!editedPreviewUrl) return
    
    try {
      // 获取blob
      const response = await fetch(editedPreviewUrl)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fileName = selectedFile ? `edited-${selectedFile.name}` : `edited-face.${selectedFormat}`
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      addHistoryItem({
          type: "image",
          input: {
            format: 'image'
          },
          output: {
            format: selectedFormat // 使用format字段而不是fileName
          }
        })
      
      toast({
        title: "下载成功",
        description: "编辑后的图片已下载",
      })
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载图片，请重试",
        variant: "destructive",
      })
    }
  }

  // clearCurrent function removed as it's not being used

  // 渲染美颜工具面板
  const renderBeautyTools = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">美颜预设</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {beautyPresets.map(preset => (
            <button
              key={preset.id}
              className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
              onClick={() => applyPreset(preset.id)}
              title={preset.description}
            >
              <div className="text-sm font-medium text-gray-800">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">美颜调整</h3>
        <div className="space-y-5">
          {beautyAdjustments.map(adjustment => (
            <div key={adjustment.type} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center text-blue-600">
                    {adjustment.icon}
                  </div>
                  <Label htmlFor={`adjustment-${adjustment.type}`} className="font-medium">
                    {adjustment.label}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {adjustment.value}
                </Badge>
              </div>
              <Slider
                id={`adjustment-${adjustment.type}`}
                defaultValue={[adjustment.value]}
                min={adjustment.min}
                max={adjustment.max}
                step={adjustment.step}
                value={[adjustment.value]}
                onValueChange={(value) => updateBeautyAdjustment(adjustment.type, value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{adjustment.min}</span>
                <span>{adjustment.max}</span>
              </div>
              <div className="text-xs text-gray-600 italic">
                {adjustment.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // 渲染表情调整面板
  const renderExpressionTools = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">表情调整</h3>
        <div className="space-y-5">
          {expressions.map(expression => (
            <div key={expression.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center text-indigo-600">
                    {expression.icon}
                  </div>
                  <Label htmlFor={`expression-${expression.id}`} className="font-medium">
                    {expression.name}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {expression.intensity}%
                </Badge>
              </div>
              <Slider
                id={`expression-${expression.id}`}
                defaultValue={[expression.intensity]}
                min={0}
                max={100}
                step={5}
                value={[expression.intensity]}
                onValueChange={(value) => updateExpression(expression.id, value[0])}
                className="w-full"
              />
              <div className="text-xs text-gray-600 italic">
                {expression.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Alert className="bg-indigo-50 border-indigo-200">
        <Info className="h-4 w-4 text-indigo-600" />
        <AlertTitle className="text-indigo-800 font-medium">提示</AlertTitle>
        <AlertDescription className="text-indigo-700">
          表情调整效果取决于原始图片的面部特征清晰度。过高的强度可能导致不自然的效果。
        </AlertDescription>
      </Alert>
    </div>
  )

  // 渲染编辑界面
  const renderEditInterface = () => {
    if (!selectedFile || !previewUrl) return null
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧预览区域 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-medium text-gray-800">预览</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`p-2 rounded-md ${showComparison ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title={showComparison ? "关闭对比" : "对比原图"}
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => saveToHistory()}
                className="p-2 rounded-md hover:bg-gray-100"
                title="保存当前状态"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <button
                onClick={resetAllChanges}
                className="p-2 rounded-md hover:bg-gray-100"
                title="重置所有编辑"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="relative aspect-square max-h-[500px] w-full mx-auto bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">人脸检测中...</h4>
                <p className="text-sm text-gray-600 mb-4">正在识别面部特征，请稍候</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${faceDetectionProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{faceDetectionProgress}%</p>
              </div>
            ) : (
              <>
                {editedPreviewUrl && (
                  <img 
                    src={editedPreviewUrl} 
                    alt="编辑预览" 
                    className={`w-full h-full object-contain transition-opacity duration-300 ${showComparison ? 'opacity-100' : 'opacity-100'}`}
                  />
                )}
                {showComparison && previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="原始图片" 
                    className="absolute inset-0 w-full h-full object-contain opacity-50 transition-opacity duration-300 mix-blend-difference" 
                  />
                )}
                
                {!isFaceDetected && !isProcessing && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Alert className="bg-amber-50 border-amber-200 max-w-md">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-medium">未检测到人脸</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        请上传包含清晰人脸的图片以获得最佳编辑效果
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </>
            )}
          </div>
          
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-800">编辑历史</h4>
              <div className="flex overflow-x-auto gap-3 pb-2">
                {history.map((item, index) => (
                  <button
                    key={index}
                    className={`relative flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${item.previewUrl === editedPreviewUrl ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                    onClick={() => restoreFromHistory(item)}
                    title={`历史记录 ${index + 1}`}
                  >
                    <img 
                      src={item.previewUrl} 
                      alt={`历史记录 ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧工具面板 */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="beauty" value={activeTool} onValueChange={setActiveTool}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="beauty">
                <Sparkles className="w-4 h-4 mr-1" />
                美颜
              </TabsTrigger>
              <TabsTrigger value="expression">
                <Smile className="w-4 h-4 mr-1" />
                表情
              </TabsTrigger>
            </TabsList>
            <TabsContent value="beauty" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {renderBeautyTools()}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="expression" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {renderExpressionTools()}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <Button 
            variant="default" 
            onClick={downloadImage}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            下载编辑结果
          </Button>
        </div>
      </div>
    )
  }

  // 清理资源
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (editedPreviewUrl && editedPreviewUrl !== previewUrl) {
        URL.revokeObjectURL(editedPreviewUrl)
      }
      history.forEach(item => {
        URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [previewUrl, editedPreviewUrl, history])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse delay-700">
            </div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000">
            </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-red-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse">
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
              <CardHeader className="bg-gradient-to-r from-pink-50 to-red-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  智能人脸编辑
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
                      disabled={!selectedFile}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      编辑人脸
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
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-pink-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持JPG、PNG、WebP等常见图片格式</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          智能美颜
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <Smile className="w-3 h-3 mr-1" />
                          表情调整
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Eye className="w-3 h-3 mr-1" />
                          实时预览
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">使用示例图片</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {sampleImages.map(sample => (
                          <div 
                            key={sample.id}
                            className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => loadSampleImage(sample.url)}
                          >
                            <div className="aspect-[3/4] bg-gray-100">
                              <img 
                                src={sample.url} 
                                alt={sample.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium">
                                使用此示例
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 text-center">
                              <p className="text-sm font-medium text-gray-800">{sample.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert className="bg-pink-50 border-pink-200">
                      <AlertCircle className="h-4 w-4 text-pink-600" />
                      <AlertTitle className="text-pink-800 font-medium">提示</AlertTitle>
                      <AlertDescription className="text-pink-700">
                        为获得最佳效果，建议上传包含清晰正面人脸的图片。系统会自动检测人脸并提供相应的编辑选项。所有编辑操作均在本地完成，确保隐私安全。
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="edit" className="space-y-6">
                    {renderEditInterface()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 隐藏的canvas用于处理 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      <canvas ref={faceCanvasRef} className="hidden"></canvas>
    </TooltipProvider>
  )
}
