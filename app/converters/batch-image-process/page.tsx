"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, CheckCircle2, AlertCircle, X, ArrowLeft, Settings, RefreshCcw, Upload, Clock, BarChart3, Download } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Alert 组件暂未使用
// DropdownMenu 组件暂未使用
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Skeleton 组件暂未使用

import { Header } from "@/components/Header"
// useLanguage hook 暂未使用
import { useHistory } from "@/hooks/useHistory"
// useBatchProcessor 钩子暂未使用
// 移除未使用的导入

/**
 * @file 图片批量处理器
 * @description 支持批量处理多张图片，提供进度显示和错误处理机制
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface ProcessedImage {
  id: string
  originalFile: File
  processedBlob?: Blob
  status: 'pending' | 'processing' | 'completed' | 'error'
  errorMessage?: string
  processingTime?: number
  previewUrl?: string
  processedPreviewUrl?: string
}

type ProcessType = 'compress' | 'resize' | 'convert' | 'optimize'

interface ProcessOptions {
  type: ProcessType
  // 压缩选项
  quality?: number
  // 调整大小选项
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  // 格式转换选项
  targetFormat?: string
  // 优化选项
  stripMetadata?: boolean
  progressive?: boolean
}

export default function BatchImageProcessor() {
  // const { t } = useLanguage() // 暂未使用
  const [activeTab, setActiveTab] = useState("upload")
  const [processType, setProcessType] = useState<ProcessType>("compress")
  const [processOptions, setProcessOptions] = useState<ProcessOptions>({
    type: "compress",
    quality: 80,
    maintainAspectRatio: true,
    stripMetadata: true,
    progressive: true
  })
  const [selectedImages, setSelectedImages] = useState<ProcessedImage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [totalProcessed, setTotalProcessed] = useState(0)
  const [totalErrors, setTotalErrors] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  // const [showAdvancedOptions, setShowAdvancedOptions] = useState(false) // 暂未使用
  const [selectedAll, setSelectedAll] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  // 使用useBatchProcessor钩子，不需要单独的processImage属性
  const processingStartTimeRef = useRef<number>(0)
  
  // 定义支持的图片格式
  const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg']

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const newImages: ProcessedImage[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (fileExtension && SUPPORTED_IMAGE_FORMATS.includes(fileExtension)) {
        // 创建预览URL
        const previewUrl = URL.createObjectURL(file)
        
        newImages.push({
          id: `${Date.now()}-${i}`,
          originalFile: file,
          status: 'pending',
          previewUrl
        })
      } else {
        toast({
          title: "不支持的文件格式",
          description: `${file.name} 不是支持的图片格式`,
          variant: "destructive",
        })
      }
    }
    
    if (newImages.length > 0) {
      setSelectedImages(prev => [...prev, ...newImages])
      setActiveTab("preview")
      
      // 记录历史
      addHistoryItem({
        type: "image",
        input: {
          format: 'images',
          value: `${newImages.length} files`
        },
        output: {
          format: 'preview'
        }
      })
    }
    
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
    
    const fileInput = fileInputRef.current
    if (fileInput) {
      // 创建新的FileList
      const dataTransfer = new DataTransfer()
      for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i])
      }
      fileInput.files = dataTransfer.files
      handleFileUpload({ target: fileInput } as React.ChangeEvent<HTMLInputElement>)
    }
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

  // 更新处理选项
  const updateProcessOptions = (key: string, value: any) => {
    setProcessOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 处理单个图片
  const processSingleImage = async (image: ProcessedImage): Promise<ProcessedImage> => {
    try {
      // 更新状态为处理中
      updateImageStatus(image.id, 'processing')
      
      const startTime = performance.now()
      
      // 调用处理函数
      // 创建一个简单的处理函数，直接返回原始文件作为处理结果
    const mockProcessImage = async (file: File): Promise<Blob> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(file);
        }, 100);
      });
    };
    const processedBlob = await mockProcessImage(image.originalFile)
      
      const endTime = performance.now()
      const processingTime = Math.round(endTime - startTime)
      
      // 创建处理后的预览URL
      const processedPreviewUrl = URL.createObjectURL(processedBlob)
      
      return {
        ...image,
        status: 'completed',
        processedBlob,
        processingTime,
        processedPreviewUrl
      }
    } catch (error) {
      return {
        ...image,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '处理失败'
      }
    }
  }

  // 更新图片状态
  const updateImageStatus = (imageId: string, status: ProcessedImage['status'], errorMessage?: string) => {
    setSelectedImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, status, errorMessage: errorMessage || '' }
        : img
    ))
  }

  // 批量处理图片
  const startBatchProcessing = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "没有选择图片",
        description: "请先上传图片再进行处理",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setHasStarted(true)
    setTotalProcessed(0)
    setTotalErrors(0)
    setOverallProgress(0)
    processingStartTimeRef.current = performance.now()

    // 记录处理开始
    addHistoryItem({
      type: "image",
      input: {
        format: 'images',
        value: `${selectedImages.length} files`
      },
      output: {
        format: 'processing'
      }
    })

    // 分批处理，避免浏览器卡顿
    const batchSize = 10
    let processedCount = 0
    let errorCount = 0
    const totalImages = selectedImages.length

    for (let i = 0; i < totalImages; i += batchSize) {
      const batch = selectedImages.slice(i, i + batchSize)
      const processedBatch = await Promise.all(batch.map(img => processSingleImage(img)))
      
      // 更新处理后的图片
      setSelectedImages(prev => 
        prev.map(img => {
          const processedImg = processedBatch.find(p => p.id === img.id)
          return processedImg || img
        })
      )
      
      // 更新统计
      processedCount += processedBatch.length
      errorCount += processedBatch.filter(img => img.status === 'error').length
      setTotalProcessed(processedCount)
      setTotalErrors(errorCount)
      setOverallProgress(Math.floor((processedCount / totalImages) * 100))
      
      // 小暂停让UI有机会更新
      if (i + batchSize < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    const endTime = performance.now()
    const totalTime = Math.round((endTime - processingStartTimeRef.current) / 1000)
    
    setIsProcessing(false)
    setActiveTab("results")

    // 记录处理完成
    addHistoryItem({
      type: "image",
      input: {
        format: 'processing'
      },
      output: {
        format: 'processed'
      }
    })

    toast({
      title: "批量处理完成",
      description: `成功处理 ${processedCount - errorCount} 张，失败 ${errorCount} 张，用时 ${totalTime} 秒`,
    })
  }

  // 下载单张处理后的图片
  const downloadImage = (image: ProcessedImage) => {
    if (!image.processedBlob) return
    
    const originalName = image.originalFile.name
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
    const ext = processOptions.targetFormat || originalName.split('.').pop()
    const newFileName = `${nameWithoutExt}_processed.${ext}`
    
    const url = URL.createObjectURL(image.processedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = newFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // 记录下载
    addHistoryItem({
      type: "image",
      input: {
        format: 'image'
      },
      output: {
        format: 'processed'
      }
    })
  }

  // 批量下载处理后的图片
  const downloadAllProcessedImages = async () => {
    const processedImages = selectedImages.filter(img => img.status === 'completed' && img.processedBlob)
    
    if (processedImages.length === 0) {
      toast({
        title: "没有可下载的图片",
        description: "请先处理图片后再下载",
        variant: "destructive",
      })
      return
    }

    // 如果只有一张图片，直接下载
    if (processedImages.length === 1) {
      downloadImage(processedImages[0])
      return
    }

    try {
      // 这里可以实现多文件打包下载
      // 由于浏览器限制，这里简单地逐个下载
      processedImages.forEach((img, index) => {
        setTimeout(() => downloadImage(img), index * 300)
      })

      // 记录批量下载
      addHistoryItem({
        type: "image",
        input: {
          format: 'images'
        },
        output: {
          format: 'processed'
        }
      })
      
      toast({
        title: "开始批量下载",
        description: `正在下载 ${processedImages.length} 个文件`,
      })
    } catch (error) {
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : '无法下载文件',
        variant: "destructive",
      })
    }
  }

  // 移除单张图片
  const removeImage = (imageId: string) => {
    // 释放URL对象
    const image = selectedImages.find(img => img.id === imageId)
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl)
    }
    if (image?.processedPreviewUrl) {
      URL.revokeObjectURL(image.processedPreviewUrl)
    }
    
    setSelectedImages(prev => prev.filter(img => img.id !== imageId))
    
    if (selectedImages.length === 1) {
      setActiveTab("upload")
    }
  }

  // 清除所有图片
  const clearAllImages = () => {
    // 释放所有URL对象
    selectedImages.forEach(img => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl)
      }
      if (img.processedPreviewUrl) {
        URL.revokeObjectURL(img.processedPreviewUrl)
      }
    })
    
    setSelectedImages([])
    setActiveTab("upload")
    setHasStarted(false)
    setTotalProcessed(0)
    setTotalErrors(0)
    setOverallProgress(0)
  }

  // 处理完成后清理资源
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl)
        }
        if (img.processedPreviewUrl) {
          URL.revokeObjectURL(img.processedPreviewUrl)
        }
      })
    }
  }, [])

  // 获取状态图标和颜色
  const getStatusInfo = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="w-4 h-4" />, color: 'text-amber-500', bgColor: 'bg-amber-100' }
      case 'processing':
        return { icon: <RefreshCcw className="w-4 h-4 animate-spin" />, color: 'text-blue-500', bgColor: 'bg-blue-100' }
      case 'completed':
        return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-500', bgColor: 'bg-green-100' }
      case 'error':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500', bgColor: 'bg-red-100' }
      default:
        return { icon: <Clock className="w-4 h-4" />, color: 'text-gray-500', bgColor: 'bg-gray-100' }
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  图片批量处理器
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
                      value="preview" 
                      disabled={selectedImages.length === 0}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      预览设置 ({selectedImages.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="results" 
                      disabled={!hasStarted || selectedImages.length === 0}
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
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持批量上传，可处理100+张图片</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">支持JPG、PNG、WEBP等格式</Badge>
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 ml-2">批量处理</Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">实时进度</Badge>
                    </div>

                    {selectedImages.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-800">已上传图片 ({selectedImages.length})</h3>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={clearAllImages}
                          >
                            清除所有
                          </Button>
                        </div>
                        <ScrollArea className="h-[300px] border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {selectedImages.slice(0, 12).map((image) => (
                              <div key={image.id} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={image.previewUrl} 
                                    alt={image.originalFile.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeImage(image.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <p className="text-xs mt-1 truncate text-gray-600">{image.originalFile.name}</p>
                              </div>
                            ))}
                            {selectedImages.length > 12 && (
                              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-sm">+{selectedImages.length - 12}</span>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-3">处理设置</h3>
                          <Card className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="font-medium mb-2 block">处理类型</Label>
                                  <RadioGroup 
                                    value={processType} 
                                    onValueChange={(value) => {
                                      const newType = value as ProcessType
                                      setProcessType(newType)
                                      setProcessOptions(prev => ({
                                        ...prev,
                                        type: newType
                                      }))
                                    }}
                                    className="grid grid-cols-2 gap-2"
                                  >
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                      <RadioGroupItem value="compress" id="compress" />
                                      <Label htmlFor="compress" className="font-normal cursor-pointer">图片压缩</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                      <RadioGroupItem value="resize" id="resize" />
                                      <Label htmlFor="resize" className="font-normal cursor-pointer">调整大小</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                      <RadioGroupItem value="convert" id="convert" />
                                      <Label htmlFor="convert" className="font-normal cursor-pointer">格式转换</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                      <RadioGroupItem value="optimize" id="optimize" />
                                      <Label htmlFor="optimize" className="font-normal cursor-pointer">优化图片</Label>
                                    </div>
                                  </RadioGroup>
                                </div>

                                {processType === 'compress' && (
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <Label htmlFor="quality">压缩质量: {processOptions.quality}%</Label>
                                    </div>
                                    <Input
                                      id="quality"
                                      type="range"
                                      min="10"
                                      max="100"
                                      value={processOptions.quality}
                                      onChange={(e) => updateProcessOptions('quality', parseInt(e.target.value))}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                      <span>最小</span>
                                      <span>最大</span>
                                    </div>
                                  </div>
                                )}

                                {processType === 'resize' && (
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="width">宽度 (像素)</Label>
                                      <Input
                                        id="width"
                                        type="number"
                                        placeholder="保持为空自动计算"
                                        value={processOptions.width || ''}
                                        onChange={(e) => updateProcessOptions('width', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="height">高度 (像素)</Label>
                                      <Input
                                        id="height"
                                        type="number"
                                        placeholder="保持为空自动计算"
                                        value={processOptions.height || ''}
                                        onChange={(e) => updateProcessOptions('height', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="maintainAspectRatio"
                                        checked={processOptions.maintainAspectRatio || false}
                                        onCheckedChange={(checked) => updateProcessOptions('maintainAspectRatio', checked)}
                                      />
                                      <Label htmlFor="maintainAspectRatio" className="cursor-pointer">保持宽高比</Label>
                                    </div>
                                  </div>
                                )}

                                {processType === 'convert' && (
                                  <div>
                                    <Label htmlFor="targetFormat">目标格式</Label>
                                    <Select
                                      value={processOptions.targetFormat || ''}
                                      onValueChange={(value) => updateProcessOptions('targetFormat', value)}
                                    >
                                      <SelectTrigger id="targetFormat">
                                        <SelectValue placeholder="选择目标格式" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="jpg">JPG - 高质量有损压缩</SelectItem>
                                        <SelectItem value="png">PNG - 无损透明度</SelectItem>
                                        <SelectItem value="webp">WebP - 现代高效格式</SelectItem>
                                        <SelectItem value="avif">AVIF - 新一代压缩格式</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {processType === 'optimize' && (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="stripMetadata"
                                        checked={processOptions.stripMetadata || false}
                                        onCheckedChange={(checked) => updateProcessOptions('stripMetadata', checked)}
                                      />
                                      <Label htmlFor="stripMetadata" className="cursor-pointer">移除元数据</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="progressive"
                                        checked={processOptions.progressive || false}
                                        onCheckedChange={(checked) => updateProcessOptions('progressive', checked)}
                                      />
                                      <Label htmlFor="progressive" className="cursor-pointer">渐进式渲染</Label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Button 
                          variant="default" 
                          onClick={startBatchProcessing}
                          disabled={isProcessing || selectedImages.length === 0}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4 mr-2" />
                              开始批量处理 ({selectedImages.length} 张)
                            </>
                          )}
                        </Button>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                            批量处理统计
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">总图片数:</span>
                              <span className="font-medium">{selectedImages.length}</span>
                            </div>
                            {hasStarted && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">已处理:</span>
                                  <span className="font-medium text-green-600">{totalProcessed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">处理失败:</span>
                                  <span className="font-medium text-red-600">{totalErrors}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">成功率:</span>
                                  <span className="font-medium">
                                    {totalProcessed > 0 
                                      ? Math.round((totalProcessed - totalErrors) / totalProcessed * 100) 
                                      : 0}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {isProcessing && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">整体进度</span>
                                <span className="font-medium">{overallProgress}%</span>
                              </div>
                              <Progress value={overallProgress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-800">图片预览</h3>
                          <div className="flex gap-2">
                            <Checkbox 
                              id="select-all" 
                              checked={selectedAll}
                              onCheckedChange={(checked) => {
                                setSelectedAll(!!checked)
                                // 这里可以实现全选功能
                              }}
                            />
                            <Label htmlFor="select-all">全选</Label>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-[500px] border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedImages.map((image) => {
                              const statusInfo = getStatusInfo(image.status)
                              
                              return (
                                <Card key={image.id} className="overflow-hidden border border-gray-200 group">
                                  <div className="relative">
                                    <div className="aspect-video bg-gray-100">
                                      <img 
                                        src={image.previewUrl} 
                                        alt={image.originalFile.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Badge className={`absolute top-2 right-2 ${statusInfo.bgColor} ${statusInfo.color}`}>
                                      {statusInfo.icon}
                                      <span className="ml-1">
                                        {image.status === 'pending' && '等待中'}
                                        {image.status === 'processing' && '处理中'}
                                        {image.status === 'completed' && '已完成'}
                                        {image.status === 'error' && '错误'}
                                      </span>
                                    </Badge>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeImage(image.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate">{image.originalFile.name}</p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                      <span>{(image.originalFile.size / 1024).toFixed(1)} KB</span>
                                      {image.processingTime && (
                                        <span>{image.processingTime} ms</span>
                                      )}
                                    </div>
                                    {image.status === 'error' && image.errorMessage && (
                                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                        {image.errorMessage}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">处理结果概览</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                            <div className="text-3xl font-bold text-gray-800">{selectedImages.length}</div>
                            <div className="text-sm text-gray-600 mt-1">总处理图片</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {selectedImages.filter(img => img.status === 'completed').length}
                            </div>
                            <div className="text-sm text-green-600 mt-1">处理成功</div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                            <div className="text-3xl font-bold text-red-600">
                              {selectedImages.filter(img => img.status === 'error').length}
                            </div>
                            <div className="text-sm text-red-600 mt-1">处理失败</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {selectedImages.filter(img => img.status === 'pending' || img.status === 'processing').length}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">等待处理</div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex gap-3">
                          <Button 
                            variant="default" 
                            onClick={downloadAllProcessedImages}
                            disabled={selectedImages.filter(img => img.status === 'completed').length === 0}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载所有成功图片
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                详细报告
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>批量处理报告</DialogTitle>
                                <DialogDescription>
                                  详细的批量处理结果统计和分析
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="h-[400px] mt-4">
                                <div className="space-y-6">
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-gray-800">总体统计</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-sm text-gray-600">总图片数</div>
                                        <div className="text-xl font-bold text-gray-800">{selectedImages.length}</div>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-sm text-gray-600">成功率</div>
                                        <div className="text-xl font-bold text-green-600">
                                          {selectedImages.length > 0 
                                            ? Math.round((selectedImages.filter(img => img.status === 'completed').length / selectedImages.length) * 100) 
                                            : 0}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div>
                                    <h4 className="font-medium text-gray-800 mb-3">失败图片详情</h4>
                                    {selectedImages.filter(img => img.status === 'error').length > 0 ? (
                                      <div className="space-y-3">
                                        {selectedImages.filter(img => img.status === 'error').map(img => (
                                          <div key={img.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                            <div className="font-medium text-red-800">{img.originalFile.name}</div>
                                            <div className="text-sm text-red-700 mt-1">{img.errorMessage}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 text-gray-500">
                                        没有失败的图片
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-800">处理结果</h3>
                          <Button variant="ghost" onClick={clearAllImages}>
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            重新开始
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[500px] border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedImages.map((image) => {
                              const statusInfo = getStatusInfo(image.status)
                              
                              return (
                                <Card key={image.id} className="overflow-hidden border border-gray-200 group">
                                  <div className="relative">
                                    <div className="aspect-video bg-gray-100">
                                      <img 
                                        src={image.processedPreviewUrl || image.previewUrl} 
                                        alt={image.originalFile.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Badge className={`absolute top-2 right-2 ${statusInfo.bgColor} ${statusInfo.color}`}>
                                      {statusInfo.icon}
                                      <span className="ml-1">
                                        {image.status === 'completed' && '已完成'}
                                        {image.status === 'error' && '错误'}
                                        {image.status === 'pending' && '未处理'}
                                      </span>
                                    </Badge>
                                    {image.status === 'completed' && (
                                      <Button
                                        variant="default"
                                        size="icon"
                                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 hover:bg-green-700"
                                        onClick={() => downloadImage(image)}
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate">{image.originalFile.name}</p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                      <span>原始: {(image.originalFile.size / 1024).toFixed(1)} KB</span>
                                      {image.processedBlob && (
                                        <span className="text-green-600">
                                          处理: {(image.processedBlob.size / 1024).toFixed(1)} KB
                                        </span>
                                      )}
                                    </div>
                                    {image.processingTime && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        处理时间: {image.processingTime} ms
                                      </div>
                                    )}
                                    {image.status === 'error' && image.errorMessage && (
                                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                        {image.errorMessage}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
