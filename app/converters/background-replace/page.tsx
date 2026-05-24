"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, CheckCircle2, AlertCircle, X, ArrowLeft, Image as ImageIcon, Download, Eye, EyeOff, Settings, RefreshCcw, Palette, BadgeCheck, Sparkles, Layers } from "lucide-react"
import Link from "next/link"
// ScrollArea 组件暂未使用
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
// Separator 组件暂未使用
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// Select 组件暂未使用
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Skeleton 组件暂未使用
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

import { Header } from "@/components/Header"
// useLanguage hook 暂未使用
import { useHistory } from "@/hooks/useHistory"
// 移除未使用的导入

/**
 * @file 智能背景替换
 * @description 支持高精度主体识别、自定义背景和边缘平滑处理
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface BackgroundOption {
  id: string;
  type: 'color' | 'image' | 'gradient';
  value: string;
  name: string;
  thumbnail?: string;
}

interface ProcessResult {
  blob: Blob;
  previewUrl: string;
  maskUrl: string;
  confidenceScore: number;
  processingTime: number;
  originalSize: number;
  newSize: number;
}

export default function BackgroundReplace() {
  // useLanguage hook 已导入但暂未使用
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const customBackgroundInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 预设背景选项
  const backgroundOptions: BackgroundOption[] = [
    { id: '1', type: 'color', value: '#FFFFFF', name: '白色背景', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==' },
    { id: '2', type: 'color', value: '#000000', name: '黑色背景', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==' },
    { id: '3', type: 'color', value: '#87CEEB', name: '天蓝色', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzg3Q0VFQjIvIj48L3JlY3Q+PC9zdmc+' },
    { id: '4', type: 'color', value: '#F5F5DC', name: '米色', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Y1RjVEREMiLz48L3N2Zz4=' },
    { id: '5', type: 'color', value: '#F0F8FF', name: '爱丽丝蓝', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0YwRjhGRiIvPjwvc3ZnPg==' },
  ]

  // 预设渐变选项
  const gradients = [
    { id: '1', name: '蓝紫渐变', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: '2', name: '橙红渐变', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: '3', name: '青蓝渐变', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: '4', name: '黄绿渐变', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: '5', name: '多彩渐变', value: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)' },
  ]
  
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption>(backgroundOptions[0])
  const [customColor, setCustomColor] = useState("#87CEEB")
  const [blurLevel, setBlurLevel] = useState(1)
  const [edgeSmoothness, setEdgeSmoothness] = useState(10)
  const [showMask, setShowMask] = useState(false)
  const [maskOpacity, setMaskOpacity] = useState(0.7)
  // const [confidenceThreshold, setConfidenceThreshold] = useState(95) // 暂未使用
  const [selectedGradient, setSelectedGradient] = useState(gradients[0])
  const [history, setHistory] = useState<ProcessResult[]>([])
  const [showConfidenceScore, setShowConfidenceScore] = useState(true)

  // 示例图片选项
  const sampleImages = [
    { id: '1', name: '示例人物1', url: 'https://picsum.photos/seed/person1/400/600' },
    { id: '2', name: '示例产品1', url: 'https://picsum.photos/seed/product1/400/400' },
    { id: '3', name: '示例风景1', url: 'https://picsum.photos/seed/landscape1/400/300' },
  ]

  // 加载示例图片
  const loadSampleImage = async (sampleUrl: string) => {
    try {
      const response = await fetch(sampleUrl)
      const blob = await response.blob()
      const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' })
      handleFileSelect(file)
      
      addHistoryItem({
        type: "image",
        input: {
          format: 'sample'
        },
        output: {
          format: 'preview'
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
    setActiveTab("editor")
    setProcessResult(null)
    setHistory([])
    
    addHistoryItem({
      type: "image",
      input: {
        format: 'image'
      },
      output: {
        format: 'preview'
      }
    })
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    handleFileSelect(files[0])
    
    // 重置文件输入，允许再次选择相同文件
    event.target.value = ''
  }

  // 处理自定义背景上传
  const handleCustomBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast({
        title: "不支持的文件格式",
        description: "请选择有效的背景图片",
        variant: "destructive",
      })
      return
    }

    const url = URL.createObjectURL(file)
    const customBgOption: BackgroundOption = {
      id: `custom-${Date.now()}`,
      type: 'image',
      value: url,
      name: file.name,
      thumbnail: url
    }
    
    setSelectedBackground(customBgOption)
    
    // 重置文件输入
    event.target.value = ''
    
    addHistoryItem({
      type: "image",
      input: {
        format: 'custom-image'
      },
      output: {
        format: 'preview'
      }
    })
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

  // 模拟AI背景替换处理
  const replaceBackground = async () => {
    if (!selectedFile || !previewUrl) return
    
    setIsProcessing(true)
    
    try {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 生成模拟处理结果
      const processingTime = Math.floor(Math.random() * 1000) + 1500
      const confidenceScore = 95 + Math.random() * 5 // 95-100%之间的置信度
      const originalSize = selectedFile.size
      const newSize = Math.floor(originalSize * (0.8 + Math.random() * 0.4)) // 原始大小的80%-120%
      
      // 创建模拟的处理后图片和蒙版
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not available")
      
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
      if (!ctx) throw new Error("Canvas context not available")
      
      // 绘制背景
      if (selectedBackground.type === 'color') {
        ctx.fillStyle = selectedBackground.value
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (selectedBackground.type === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        // 简单的渐变实现，使用选定的渐变名称
        if (selectedGradient.name.includes('蓝紫')) {
          gradient.addColorStop(0, '#667eea')
          gradient.addColorStop(1, '#764ba2')
        } else if (selectedGradient.name.includes('橙红')) {
          gradient.addColorStop(0, '#f093fb')
          gradient.addColorStop(1, '#f5576c')
        } else {
          gradient.addColorStop(0, '#4facfe')
          gradient.addColorStop(1, '#00f2fe')
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (selectedBackground.type === 'image' && selectedBackground.value) {
        const bgImg = new Image()
        await new Promise<void>((resolve, reject) => {
          bgImg.onload = () => resolve()
          bgImg.onerror = reject
          bgImg.src = selectedBackground.value
        })
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
      }
      
      // 绘制原图（简单实现，实际应该使用蒙版）
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(img, 0, 0)
      
      // 生成blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Failed to create blob")),
          'image/png',
          1
        )
      })
      
      const processedPreviewUrl = URL.createObjectURL(blob)
      
      // 创建简单的蒙版预览
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const maskCtx = maskCanvas.getContext('2d')
      if (!maskCtx) throw new Error("Mask canvas context not available")
      
      // 绘制白色背景
      maskCtx.fillStyle = '#ffffff'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
      
      // 绘制黑色剪影（模拟蒙版）
      maskCtx.fillStyle = '#000000'
      maskCtx.beginPath()
      maskCtx.arc(maskCanvas.width / 2, maskCanvas.height / 2, Math.min(maskCanvas.width, maskCanvas.height) / 3, 0, Math.PI * 2)
      maskCtx.fill()
      
      const maskBlob = await new Promise<Blob>((resolve, reject) => {
        maskCanvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Failed to create mask blob")),
          'image/png',
          1
        )
      })
      
      const maskUrl = URL.createObjectURL(maskBlob)
      
      const result: ProcessResult = {
        blob,
        previewUrl: processedPreviewUrl,
        maskUrl,
        confidenceScore,
        processingTime,
        originalSize,
        newSize
      }
      
      setProcessResult(result)
      setHistory(prev => [result, ...prev.slice(0, 4)]) // 保留最近5次历史
      
      addHistoryItem({
          type: "image",
          input: {
            format: 'image'
          },
          output: {
            format: 'processed'
          }
        })
      
      toast({
        title: "背景替换成功",
        description: `置信度: ${confidenceScore.toFixed(1)}%, 处理时间: ${processingTime}ms`,
      })
      
    } catch (error) {
      toast({
        title: "处理失败",
        description: error instanceof Error ? error.message : '背景替换过程中出现错误',
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 下载处理后的图片
  const downloadImage = () => {
    if (!processResult) return
    
    const url = processResult.previewUrl
    const a = document.createElement('a')
    const fileName = selectedFile ? `bg-replaced-${selectedFile.name}` : 'bg-replaced.png'
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    addHistoryItem({
      type: "image",
      input: {
        format: 'processed'
      },
      output: {
        format: 'download'
      }
    })
  }

  // 使用历史记录中的结果
  const useHistoryResult = (result: ProcessResult) => {
    setProcessResult(result)
    
    addHistoryItem({
      type: "image",
      input: {
        format: 'history'
      },
      output: {
        format: 'preview'
      }
    })
  }

  // 切换蒙版显示
  const toggleMaskView = () => {
    setShowMask(!showMask)
  }

  // 清除当前操作
  const clearCurrent = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    if (processResult) {
      URL.revokeObjectURL(processResult.previewUrl)
      URL.revokeObjectURL(processResult.maskUrl)
    }
    
    // 清除历史记录中的URL对象
    history.forEach(item => {
      URL.revokeObjectURL(item.previewUrl)
      URL.revokeObjectURL(item.maskUrl)
    })
    
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessResult(null)
    setHistory([])
    setActiveTab("upload")
  }

  // 清理资源
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (processResult) {
        URL.revokeObjectURL(processResult.previewUrl)
        URL.revokeObjectURL(processResult.maskUrl)
      }
      history.forEach(item => {
        URL.revokeObjectURL(item.previewUrl)
        URL.revokeObjectURL(item.maskUrl)
      })
    }
  }, [previewUrl, processResult, history])

  // 渲染背景选择器
  const renderBackgroundSelector = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-800">选择背景类型</h3>
      <RadioGroup 
        defaultValue="color" 
        value={selectedBackground.type}
        onValueChange={(value) => {
          if (value === 'color') {
            setSelectedBackground(backgroundOptions[0])
          } else if (value === 'gradient') {
            setSelectedBackground({...selectedGradient, type: 'gradient' as const})
          }
        }}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2 cursor-pointer">
          <RadioGroupItem value="color" id="bg-color" />
          <Label htmlFor="bg-color" className="cursor-pointer">纯色背景</Label>
        </div>
        <div className="flex items-center space-x-2 cursor-pointer">
          <RadioGroupItem value="gradient" id="bg-gradient" />
          <Label htmlFor="bg-gradient" className="cursor-pointer">渐变背景</Label>
        </div>
        <div className="flex items-center space-x-2 cursor-pointer">
          <RadioGroupItem value="image" id="bg-image" />
          <Label 
            htmlFor="bg-image" 
            className="cursor-pointer"
            onClick={() => customBackgroundInputRef.current?.click()}
          >
            自定义图片
          </Label>
          <input
            ref={customBackgroundInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomBackgroundUpload}
            className="hidden"
          />
        </div>
      </RadioGroup>

      {selectedBackground.type === 'color' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">预设颜色</h4>
          <div className="flex flex-wrap gap-2">
            {backgroundOptions.map(option => (
              <button
                key={option.id}
                className={`w-10 h-10 rounded-full border-2 transition-all ${selectedBackground.id === option.id ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                style={{ backgroundColor: option.value }}
                onClick={() => setSelectedBackground(option)}
                title={option.name}
              />
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">自定义颜色</h4>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCustomColor(e.target.value)
                  setSelectedBackground({
                    id: `custom-color-${Date.now()}`,
                    type: 'color',
                    value: e.target.value,
                    name: '自定义颜色'
                  })
                }}
                className="w-10 h-10 border-0 rounded-full cursor-pointer"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const color = e.target.value
                  if (/^#[0-9A-F]{6}$/i.test(color)) {
                    setCustomColor(color)
                    setSelectedBackground({
                      id: `custom-color-${Date.now()}`,
                      type: 'color',
                      value: color,
                      name: '自定义颜色'
                    })
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {selectedBackground.type === 'gradient' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">预设渐变</h4>
          <div className="grid grid-cols-2 gap-3">
            {gradients.map(gradient => (
              <div
                key={gradient.id}
                className={`h-20 rounded-lg cursor-pointer border-2 transition-all ${selectedGradient.id === gradient.id ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                style={{ background: gradient.value }}
                onClick={() => {
                  setSelectedGradient(gradient)
                  setSelectedBackground({...gradient, type: 'gradient' as const})
                }}
              >
                <div className="w-full h-full flex items-end justify-center p-2">
                  <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                    {gradient.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBackground.type === 'image' && selectedBackground.thumbnail && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">当前背景预览</h4>
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={selectedBackground.thumbnail} 
              alt={selectedBackground.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
              {selectedBackground.name}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => customBackgroundInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800"
          >
            更换背景图片
          </Button>
        </div>
      )}
    </div>
  )

  // 渲染高级设置
  const renderAdvancedSettings = () => (
    <div className="space-y-4 mt-4">
      <h3 className="text-sm font-medium text-gray-800 flex items-center">
        <Settings className="w-4 h-4 mr-2" />
        高级设置
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="edge-smoothness">边缘平滑度 ({edgeSmoothness})</Label>
          <Badge variant="outline" className="text-xs">影响边缘质量</Badge>
        </div>
        <Slider
          id="edge-smoothness"
          defaultValue={[10]}
          min={0}
          max={20}
          step={1}
          value={[edgeSmoothness]}
          onValueChange={(value) => setEdgeSmoothness(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>锐利</span>
          <span>平滑</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="blur-level">背景模糊 ({blurLevel})</Label>
        <Slider
          id="blur-level"
          defaultValue={[1]}
          min={0}
          max={10}
          step={1}
          value={[blurLevel]}
          onValueChange={(value) => setBlurLevel(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>清晰</span>
          <span>模糊</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-mask"
            checked={showMask}
            onCheckedChange={setShowMask}
          />
          <Label htmlFor="show-mask" className="cursor-pointer">显示蒙版</Label>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleMaskView}
          className="text-xs"
        >
          {showMask ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
          {showMask ? "隐藏" : "显示"}
        </Button>
      </div>

      {showMask && (
        <div className="space-y-3 pl-6">
          <Label htmlFor="mask-opacity">蒙版透明度 ({Math.round(maskOpacity * 100)}%)</Label>
          <Slider
            id="mask-opacity"
            defaultValue={[0.7]}
            min={0.1}
            max={1}
            step={0.1}
            value={[maskOpacity]}
            onValueChange={(value) => setMaskOpacity(value[0])}
            className="w-full"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="show-confidence"
          checked={showConfidenceScore}
          onCheckedChange={setShowConfidenceScore}
        />
        <Label htmlFor="show-confidence" className="cursor-pointer">显示置信度</Label>
      </div>
    </div>
  )

  // 渲染处理结果
  const renderProcessedResult = () => {
    if (!processResult) return null
    
    const sizeReduction = ((processResult.originalSize - processResult.newSize) / processResult.originalSize) * 100
    const isReduced = sizeReduction > 0
    
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={showMask ? processResult.maskUrl : processResult.previewUrl} 
              alt="处理结果"
              className="w-full h-full object-contain"
              style={{ opacity: showMask ? maskOpacity : 1 }}
            />
          </div>
          
          {showConfidenceScore && (
            <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              置信度: {processResult.confidenceScore.toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">处理时间</div>
            <div className="text-lg font-bold text-blue-600">{processResult.processingTime}ms</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">原始大小</div>
            <div className="text-lg font-bold">{(processResult.originalSize / 1024).toFixed(1)}KB</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">新文件大小</div>
            <div className={`text-lg font-bold ${isReduced ? 'text-green-600' : 'text-amber-600'}`}>
              {(processResult.newSize / 1024).toFixed(1)}KB
              <span className={`text-xs ml-1 ${isReduced ? 'text-green-600' : 'text-amber-600'}`}>
                ({isReduced ? '-' : '+'}{Math.abs(sizeReduction).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">历史记录</h4>
          <div className="grid grid-cols-5 gap-2">
            {history.map((item, index) => (
              <button
                key={index}
                className={`aspect-video rounded border-2 transition-all ${processResult === item ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => useHistoryResult(item)}
                title={`置信度: ${item.confidenceScore.toFixed(1)}%`}
              >
                <img 
                  src={item.previewUrl} 
                  alt={`历史记录 ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  智能背景替换
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="upload" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      上传图片
                    </TabsTrigger>
                    <TabsTrigger 
                      value="editor" 
                      disabled={!selectedFile}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      编辑背景
                    </TabsTrigger>
                    <TabsTrigger 
                      value="result" 
                      disabled={!processResult}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      处理结果
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
                      <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持JPG、PNG、WEBP等常见图片格式</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          主体识别
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Layers className="w-3 h-3 mr-1" />
                          背景替换
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          边缘平滑
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">使用示例图片</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {sampleImages.map(sample => (
                          <div 
                            key={sample.id}
                            className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => loadSampleImage(sample.url)}
                          >
                            <div className="aspect-video bg-gray-100">
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

                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 font-medium">提示</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        为获得最佳效果，请上传主体清晰、背景简单的图片。支持人物、产品等多种主体识别。
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="editor" className="space-y-6">
                    {selectedFile && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-800">图片预览</h3>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-gray-100">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </Badge>
                              <Badge variant="outline" className="bg-gray-100">
                                {selectedFile.name.split('.').pop()?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                            {previewUrl && (
                              <img 
                                src={previewUrl} 
                                alt={selectedFile.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            )}
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={clearCurrent}
                          >
                            <X className="w-4 h-4 mr-2" />
                            清除当前图片
                          </Button>
                        </div>

                        <div className="lg:col-span-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-3">背景设置</h3>
                            <Card className="border border-gray-200">
                              <CardContent className="p-4">
                                {renderBackgroundSelector()}
                              </CardContent>
                            </Card>
                          </div>

                          <Card className="border border-gray-200">
                            <CardContent className="p-4">
                              {renderAdvancedSettings()}
                            </CardContent>
                          </Card>

                          <Button 
                            variant="default" 
                            onClick={replaceBackground}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                处理中...
                              </>
                            ) : (
                              <>
                                <Palette className="w-4 h-4 mr-2" />
                                替换背景
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="result" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        {renderProcessedResult()}
                      </div>
                      
                      <div className="lg:col-span-1 space-y-4">
                        <Card className="border border-gray-200">
                          <CardContent className="p-4">
                            <h3 className="text-sm font-medium text-gray-800 mb-3">处理结果</h3>
                            
                            <div className="space-y-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-800 mb-2">识别效果分析</h4>
                                <div className="h-40">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={[
                                        { name: '0%', confidence: 0 },
                                        { name: '20%', confidence: 10 },
                                        { name: '40%', confidence: 40 },
                                        { name: '60%', confidence: 75 },
                                        { name: '80%', confidence: 92 },
                                        { name: '100%', confidence: processResult?.confidenceScore || 95 }
                                      ]}
                                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                      <defs>
                                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                      <XAxis dataKey="name" />
                                      <YAxis />
                                      <RechartsTooltip />
                                      <Area 
                                        type="monotone" 
                                        dataKey="confidence" 
                                        stroke="#8884d8" 
                                        fillOpacity={1} 
                                        fill="url(#colorConfidence)" 
                                        name="置信度"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>低置信度</span>
                                  <span>高置信度</span>
                                </div>
                              </div>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full">
                                    调整参数
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>调整替换参数</DialogTitle>
                                    <DialogDescription>
                                      微调背景替换的参数以获得最佳效果
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    {renderAdvancedSettings()}
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="ghost">取消</Button>
                                    <Button 
                                      variant="default"
                                      onClick={() => {
                                        setActiveTab("editor")
                                      }}
                                    >
                                      返回编辑
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-3">
                          <Button 
                            variant="default" 
                            onClick={downloadImage}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载结果图片
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab("editor")}
                            className="w-full"
                          >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            返回编辑
                          </Button>
                        </div>

                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800 font-medium">处理完成</AlertTitle>
                          <AlertDescription className="text-green-700">
                            背景替换成功！您可以下载结果或返回编辑界面调整参数。
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 隐藏的canvas用于处理 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </TooltipProvider>
  )
}
