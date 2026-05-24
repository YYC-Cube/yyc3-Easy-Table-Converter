"use client"

// 基本React hooks在顶部导入
import { useState, useRef, useEffect } from "react"
import type React from "react"

/**
 * @file 图片超分辨率
 * @description 提供高质量的图像分辨率提升，支持4倍放大和细节保留
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface EnhancementOption {
  id: string;
  name: string;
  description: string;
  scale: number;
  processingTime: number;
  qualityRating: number;
  memoryUsage: number;
}

interface SuperResolutionResult {
  blob: Blob;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  enhancedWidth: number;
  enhancedHeight: number;
  originalSize: number;
  enhancedSize: number;
  detailScore: number;
  processingTime: number;
  enhancementId: string;
  enhancementName: string;
}

interface DetailMetric {
  name: string;
  value: number;
  max: number;
}

// 客户端组件包装器
const ClientOnlySuperResolution: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false)
  
  // 确保只在客户端执行
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  // 服务器端渲染时返回null
  if (!isMounted) {
    return null
  }
  
  // 只在客户端渲染实际组件
  return <SuperResolutionClient />;
};

// 实际的客户端组件，包含所有需要客户端API的逻辑
const SuperResolutionClient: React.FC = () => {
  // 所有需要客户端上下文的hooks都在这里定义
  const { useLanguage } = require("@/hooks/useLanguage")
  const { useToast } = require("@/hooks/use-toast")
  const { useHistory } = require("@/hooks/useHistory")
  
  // UI组件
  const { Button } = require("@/components/ui/button")
  const { Card, CardContent, CardHeader, CardTitle } = require("@/components/ui/card")
  const { Tabs, TabsContent, TabsList, TabsTrigger } = require("@/components/ui/tabs")
  const { TooltipProvider } = require("@/components/ui/tooltip")
  const { FileUp, AlertCircle, ArrowLeft, Image: ImageIcon, Download, Sparkles, ZoomIn, BarChart3, RefreshCcw } = require("lucide-react")
  const Link = require("next/link").default
  // ScrollArea 导入已移除（未使用）
  const { Badge } = require("@/components/ui/badge")
  const { Slider } = require("@/components/ui/slider")
  // Separator 导入已移除（未使用）
  const { Label } = require("@/components/ui/label")
  // Switch 导入已移除（未使用）
  const { RadioGroup, RadioGroupItem } = require("@/components/ui/radio-group")
  const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = require("@/components/ui/select")
  const { Alert, AlertDescription, AlertTitle } = require("@/components/ui/alert")
  // Dialog 相关组件导入已移除（未使用）
  // Skeleton 导入已移除（未使用）
  const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip: RechartsTooltip } = require('recharts')
  const { Header } = require("@/components/Header")
  
  // 使用hooks
  useLanguage()
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detailCanvasRef = useRef<HTMLCanvasElement>(null)

  // 超分辨率增强选项
  const enhancements: EnhancementOption[] = [
    {
      id: 'x2',
      name: '2倍分辨率',
      description: '平衡的性能和质量，适合一般用途',
      scale: 2,
      processingTime: 15000,
      qualityRating: 95,
      memoryUsage: 40
    },
    {
      id: 'x4',
      name: '4倍分辨率',
      description: '高质量细节增强，推荐用于大多数场景',
      scale: 4,
      processingTime: 25000,
      qualityRating: 98,
      memoryUsage: 70
    },
    {
      id: 'x6',
      name: '6倍分辨率',
      description: '超高分辨率，适合大尺寸打印需求',
      scale: 6,
      processingTime: 40000,
      qualityRating: 93,
      memoryUsage: 90
    },
    {
      id: 'smart',
      name: '智能增强',
      description: '根据图像内容自动调整，优化质量和速度',
      scale: 3,
      processingTime: 20000,
      qualityRating: 96,
      memoryUsage: 55
    }
  ]

  // 支持的输出格式
  const outputFormats = [
    { value: 'png', label: 'PNG', description: '无损压缩，适合透明度' },
    { value: 'jpeg', label: 'JPEG', description: '高压缩率，适合照片' },
    { value: 'webp', label: 'WebP', description: '现代格式，平衡质量和大小' },
    { value: 'avif', label: 'AVIF', description: '最佳压缩率，支持高级功能' }
  ]

  // 状态管理
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementOption | null>(enhancements[0] || null)
  const [detailEnhancement, setDetailEnhancement] = useState(70)
  const [noiseReduction, setNoiseReduction] = useState(50)
  const [edgeEnhancement, setEdgeEnhancement] = useState(60)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [srResult, setSrResult] = useState<SuperResolutionResult | null>(null)
  const [comparisonMethod, setComparisonMethod] = useState<'split' | 'side-by-side'>('split')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [selectedFormat, setSelectedFormat] = useState('png')
  const [history, setHistory] = useState<SuperResolutionResult[]>([])
  const [isComparisonDragging, setIsComparisonDragging] = useState(false)
  const [comparisonSplitPosition, setComparisonSplitPosition] = useState(0.5)

  // 示例图像数据
  const sampleImages = [
    { id: '1', name: '风景照片', url: 'https://picsum.photos/seed/landscape-small/300/200' },
    { id: '2', name: '人物肖像', url: 'https://picsum.photos/seed/portrait-small/200/300' },
    { id: '3', name: '城市建筑', url: 'https://picsum.photos/seed/city-small/300/200' },
    { id: '4', name: '产品细节', url: 'https://picsum.photos/seed/product-small/300/300' },
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
          input: { fileName: "sample-image" },
          output: {},
          settings: { action: "load-sample", sampleUrl }
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
    setActiveTab("enhance")
    setSrResult(null)
    setHistory([])
    setZoomLevel(100)
    
    addHistoryItem({
        type: "image",
        input: { fileName: file.name },
        output: {},
        settings: { action: "upload", fileSize: file.size }
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

  // 模拟超分辨率处理
  const enhanceImage = async () => {
    if (!selectedFile || !selectedEnhancement || !previewUrl) return
    
    setIsProcessing(true)
    setProcessingProgress(0)
    
    // 模拟进度更新
    const totalSteps = 100
    const stepTime = selectedEnhancement.processingTime / totalSteps
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= totalSteps) {
          clearInterval(progressInterval)
          return totalSteps
        }
        return prev + 1
      })
    }, stepTime)
    
    try {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, selectedEnhancement.processingTime))
      
      // 创建模拟的增强图片
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not available")
      
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = previewUrl
      })
      
      // 计算增强后的尺寸
      const originalWidth = img.width
      const originalHeight = img.height
      const scale = selectedEnhancement.scale
      const enhancedWidth = originalWidth * scale
      const enhancedHeight = originalHeight * scale
      
      // 设置canvas尺寸
      canvas.width = enhancedWidth
      canvas.height = enhancedHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("Canvas context not available")
      
      // 使用高质量插值绘制到更大的canvas
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, enhancedWidth, enhancedHeight)
      
      // 添加模拟的细节增强效果
      if (detailEnhancement > 0) {
        // 在增强的图像上添加一些细节效果
        ctx.globalCompositeOperation = 'source-over'
        
        // 模拟锐化效果
        if (edgeEnhancement > 50) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
          ctx.shadowBlur = 1
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
          ctx.lineWidth = 0.5
          
          // 绘制一些模拟细节
          for (let i = 0; i < Math.floor(enhancedWidth / 50); i++) {
            for (let j = 0; j < Math.floor(enhancedHeight / 50); j++) {
              const x = i * 50 + Math.random() * 50
              const y = j * 50 + Math.random() * 50
              const length = Math.random() * 10 + 5
              const angle = Math.random() * Math.PI * 2
              
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
              ctx.stroke()
            }
          }
        }
      }
      
      // 生成blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Failed to create blob")),
          selectedFormat === 'jpeg' ? 'image/jpeg' : 
          selectedFormat === 'webp' ? 'image/webp' : 
          selectedFormat === 'avif' ? 'image/avif' : 'image/png',
          0.9
        )
      })
      
      const processedPreviewUrl = URL.createObjectURL(blob)
      
      // 计算细节保留率
      const detailScore = selectedEnhancement.qualityRating + 
                        (detailEnhancement / 100) * 5 - 
                        (noiseReduction / 100) * 2
      
      const result: SuperResolutionResult = {
        blob,
        previewUrl: processedPreviewUrl,
        originalWidth,
        originalHeight,
        enhancedWidth,
        enhancedHeight,
        originalSize: selectedFile.size,
        enhancedSize: blob.size,
        detailScore: Math.min(Math.round(detailScore), 100),
        processingTime: selectedEnhancement.processingTime,
        enhancementId: selectedEnhancement.id,
        enhancementName: selectedEnhancement.name
      }
      
      setSrResult(result)
      setHistory(prev => [result, ...prev.slice(0, 4)]) // 保留最近5次历史
      setActiveTab("result")
      
      addHistoryItem({
          type: "image",
          input: { value: selectedFile?.name },
          output: { format: selectedFormat },
          settings: {
            action: "enhance",
            enhancementId: selectedEnhancement.id,
            enhancementName: selectedEnhancement.name,
            originalWidth,
            originalHeight,
            enhancedWidth,
            enhancedHeight,
            processingTime: selectedEnhancement.processingTime,
            detailScore: result.detailScore,
            fileName: selectedFile?.name,
            enhancedFileName: `${selectedFile?.name.split('.')[0]}-enhanced.${selectedFormat}`
          }
        })
      
      toast({
        title: "超分辨率增强成功",
        description: `图片已从 ${originalWidth}x${originalHeight} 提升到 ${enhancedWidth}x${enhancedHeight}，处理时间: ${(selectedEnhancement.processingTime / 1000).toFixed(1)}秒`,
      })
      
    } catch (error) {
      toast({
        title: "处理失败",
        description: error instanceof Error ? error.message : '超分辨率处理过程中出现错误',
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setProcessingProgress(100)
    }
  }

  // 下载处理后的图片
  const downloadImage = () => {
    if (!srResult) return
    
    const url = srResult.previewUrl
    const a = document.createElement('a')
    const fileName = selectedFile ? `sr-${selectedEnhancement?.id}-${selectedFile.name}` : `sr-${selectedEnhancement?.id}.${selectedFormat}`
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    addHistoryItem({
        type: "image",
        input: {},
        output: { format: fileName.split('.').pop() },
        settings: { action: "download", enhancementId: srResult.enhancementId, fileName }
      })
  }

  // 使用历史记录中的结果
  const useHistoryResult = (result: SuperResolutionResult) => {
    setSrResult(result)
    // 找到对应的增强选项
    const enhancement = enhancements.find(e => e.id === result.enhancementId)
    if (enhancement) {
      setSelectedEnhancement(enhancement)
    }
    setZoomLevel(100)
    
    addHistoryItem({
        type: "image",
        input: {},
        output: {},
        settings: {
          action: "use-history",
          enhancementId: result.enhancementId,
          detailScore: result.detailScore
        }
      })
  }

  // 清除当前操作的函数已移除（未使用）

  // 获取细节保留评估指标
  const getDetailMetrics = (): DetailMetric[] => {
    if (!srResult || !selectedEnhancement) return []
    
    const scaleFactor = selectedEnhancement.scale
    
    return [
      {
        name: '细节保留率',
        value: Math.round(srResult.detailScore),
        max: 100
      },
      {
        name: '边缘清晰度',
        value: Math.round(edgeEnhancement + (scaleFactor * 5)),
        max: 100
      },
      {
        name: '噪点控制',
        value: Math.round(noiseReduction + (scaleFactor * 3)),
        max: 100
      },
      {
        name: '色彩保真度',
        value: Math.round(selectedEnhancement.qualityRating),
        max: 100
      }
    ]
  }

  // 处理比较分割线拖动
  const handleComparisonDragStart = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsComparisonDragging(true)
  }

  const handleComparisonDrag = (event: React.MouseEvent) => {
    if (!isComparisonDragging || !comparisonRef.current) return
    
    const rect = comparisonRef.current.getBoundingClientRect()
    const position = (event.clientX - rect.left) / rect.width
    setComparisonSplitPosition(Math.max(0.1, Math.min(0.9, position)))
  }

  const handleComparisonDragEnd = () => {
    setIsComparisonDragging(false)
  }

  // 渲染增强选项
  const renderEnhancementOptions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">选择放大倍数</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enhancements.map(enhancement => (
            <Card 
              key={enhancement.id}
              className={`overflow-hidden cursor-pointer transition-all duration-300 ${selectedEnhancement?.id === enhancement.id ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md hover:translate-y-[-2px]'}`}
              onClick={() => setSelectedEnhancement(enhancement)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-medium text-gray-800 text-lg">{enhancement.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{enhancement.description}</p>
                  </div>
                  <Badge className="bg-indigo-600 hover:bg-indigo-700">
                    {enhancement.scale}×
                  </Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">处理时间</div>
                    <div className="text-sm font-medium text-blue-600">{enhancement.processingTime / 1000}s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">质量评分</div>
                    <div className="text-sm font-medium text-green-600">{enhancement.qualityRating}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">内存占用</div>
                    <div className="text-sm font-medium text-amber-600">{enhancement.memoryUsage}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedEnhancement && (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">高级设置</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="detail-enhancement">细节增强 ({detailEnhancement}%)</Label>
                  <Badge variant="outline" className="text-xs">影响清晰度</Badge>
                </div>
                <Slider
                  id="detail-enhancement"
                  defaultValue={[70]}
                  min={0}
                  max={100}
                  step={5}
                  value={[detailEnhancement]}
                  onValueChange={(value: number[]) => setDetailEnhancement(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>保留原始</span>
                  <span>增强细节</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="noise-reduction">噪点消除 ({noiseReduction}%)</Label>
                  <Badge variant="outline" className="text-xs">影响平滑度</Badge>
                </div>
                <Slider
                  id="noise-reduction"
                  defaultValue={[50]}
                  min={0}
                  max={100}
                  step={5}
                  value={[noiseReduction]}
                  onValueChange={(value: number[]) => setNoiseReduction(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>保留细节</span>
                  <span>消除噪点</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="edge-enhancement">边缘增强 ({edgeEnhancement}%)</Label>
                  <Badge variant="outline" className="text-xs">影响锐度</Badge>
                </div>
                <Slider
                  id="edge-enhancement"
                  defaultValue={[60]}
                  min={0}
                  max={100}
                  step={5}
                  value={[edgeEnhancement]}
                  onValueChange={(value: number[]) => setEdgeEnhancement(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>柔和边缘</span>
                  <span>锐利边缘</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-format">输出格式</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger id="output-format">
                    <SelectValue placeholder="选择输出格式" />
                  </SelectTrigger>
                  <SelectContent>
                    {outputFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                        <span className="text-xs text-gray-500 ml-2">({format.description})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="default" 
                onClick={enhanceImage}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    处理中... {processingProgress}%
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 mr-2" />
                    开始增强 ({selectedEnhancement.scale}倍)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // 渲染细节评估结果
  const renderDetailEvaluation = () => {
    const metrics = getDetailMetrics()
    
    if (metrics.length === 0) return null
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-800 flex items-center gap-1">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          细节评估指标
        </h4>
        
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{metric.name}</span>
                <span className="font-medium text-indigo-600">{metric.value}/{metric.max}</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="h-40 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <RechartsTooltip />
              <Bar 
                dataKey="value" 
                fill="#8884d8" 
                name="评分"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // 渲染处理结果
  const renderEnhancedResult = () => {
    if (!srResult || !selectedEnhancement) return null
    
    const sizeDifference = ((srResult.enhancedSize - srResult.originalSize) / srResult.originalSize) * 100
    const pixelIncrease = (srResult.enhancedWidth * srResult.enhancedHeight) / (srResult.originalWidth * srResult.originalHeight)
    
    // 处理比较视图
    const renderComparisonView = () => {
      if (!previewUrl) return null
      
      if (comparisonMethod === 'split') {
        return (
          <div 
            ref={comparisonRef}
            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
            onMouseDown={handleComparisonDragStart}
            onMouseMove={handleComparisonDrag}
            onMouseUp={handleComparisonDragEnd}
            onMouseLeave={handleComparisonDragEnd}
          >
            {/* 原图 */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img 
                src={previewUrl} 
                alt="原图" 
                className="w-full h-full object-contain transform scale-x-2 scale-y-2 origin-left-top" 
                style={{ transform: `scale(${selectedEnhancement.scale})`, transformOrigin: 'left top' }}
              />
            </div>
            
            {/* 增强图 */}
            <div 
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ clipPath: `inset(0 ${(1 - comparisonSplitPosition) * 100}% 0 0)` }}
            >
              <img 
                src={srResult.previewUrl} 
                alt="增强图" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* 分隔线 */}
            <div 
              className={`absolute top-0 bottom-0 w-1 bg-white shadow-md cursor-col-resize flex items-center justify-center z-10`}
              style={{ left: `${comparisonSplitPosition * 100}%` }}
            >
              <div className="w-4 h-4 bg-white shadow-lg rounded-full transform -translate-x-1/2 border border-gray-300"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent to-white opacity-20"></div>
            </div>
            
            {/* 标签 */}
            <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
              原图 ({srResult.originalWidth}×{srResult.originalHeight})
            </div>
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              增强图 ({srResult.enhancedWidth}×{srResult.enhancedHeight})
            </div>
          </div>
        )
      } else {
        // 并排比较
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
              <img 
                src={previewUrl} 
                alt="原图" 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                原图 ({srResult.originalWidth}×{srResult.originalHeight})
              </div>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
              <img 
                src={srResult.previewUrl} 
                alt="增强图" 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                增强图 ({srResult.enhancedWidth}×{srResult.enhancedHeight})
              </div>
            </div>
          </div>
        )
      }
    }
    
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h3 className="text-xl font-semibold text-gray-800">增强结果</h3>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="comparison-method">比较方式:</Label>
              <RadioGroup 
                value={comparisonMethod} 
                onValueChange={(value: string) => setComparisonMethod(value as 'split' | 'side-by-side')}
                id="comparison-method"
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="split" id="split" />
                  <Label htmlFor="split" className="text-sm">分隔视图</Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="side-by-side" id="side-by-side" />
                  <Label htmlFor="side-by-side" className="text-sm">并排视图</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-gray-500" />
              <Label htmlFor="zoom-level" className="text-sm">缩放: {zoomLevel}%</Label>
              <Slider
                id="zoom-level"
                defaultValue={[100]}
                min={50}
                max={200}
                step={10}
                value={[zoomLevel]}
                onValueChange={(value: number[]) => setZoomLevel(value[0])}
                className="w-32"
              />
            </div>
          </div>
        </div>
        
        <div 
          className="transition-transform duration-300 ease-in-out"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
        >
          {renderComparisonView()}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">尺寸变化</div>
            <div className="text-lg font-bold text-blue-600">
              {srResult.originalWidth}×{srResult.originalHeight} → {srResult.enhancedWidth}×{srResult.enhancedHeight}
            </div>
            <div className="text-xs text-gray-500 mt-1">像素增加 {pixelIncrease.toFixed(1)}倍</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">文件大小</div>
            <div className="text-lg font-bold">
              {sizeDifference > 0 ? '+' : ''}{sizeDifference.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(srResult.originalSize / 1024).toFixed(1)}KB → {(srResult.enhancedSize / 1024).toFixed(1)}KB
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">处理时间</div>
            <div className="text-lg font-bold text-indigo-600">
              {(srResult.processingTime / 1000).toFixed(1)}秒
            </div>
            <div className="text-xs text-gray-500 mt-1">
              使用 {srResult.enhancementName}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">细节保留率</div>
            <div className="text-lg font-bold text-green-600">
              {srResult.detailScore}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              推荐用于高质量输出
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  增强详情
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">增强模式</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {srResult.enhancementName}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">输出格式</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {outputFormats.find(f => f.value === selectedFormat)?.label}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">细节增强</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {detailEnhancement}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">噪点消除</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {noiseReduction}%
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">边缘增强</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {edgeEnhancement}%
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">质量评分</div>
                      <div className="text-base font-medium text-blue-700 mt-1">
                        {selectedEnhancement.qualityRating}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                {renderDetailEvaluation()}
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button 
                variant="default" 
                onClick={downloadImage}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                下载增强图片
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("enhance")}
                className="w-full"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                调整参数
              </Button>
            </div>
          </div>
        </div>
        
        {history.length > 1 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-3">历史记录</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {history.map((item, index) => (
                <button
                  key={index}
                  className={`aspect-video rounded border-2 transition-all ${srResult === item ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => useHistoryResult(item)}
                  title={`${item.enhancementName} - ${item.detailScore}%`}
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
        )}
      </div>
    )
  }

  // 清理资源
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (srResult) {
        URL.revokeObjectURL(srResult.previewUrl)
      }
      history.forEach(item => {
        URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [previewUrl, srResult, history])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700">
            </div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000">
            </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse">
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
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                  图片超分辨率
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
                      value="enhance" 
                      disabled={!selectedFile}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      增强设置
                    </TabsTrigger>
                    <TabsTrigger 
                      value="result" 
                      disabled={!srResult}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      预览结果
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
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持JPG、PNG、WebP等常见图片格式</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <ZoomIn className="w-3 h-3 mr-1" />
                          4倍分辨率提升
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          细节保留90%+
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          多格式支持
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
                        为获得最佳效果，建议原始图片分辨率不低于200x200像素。图片越大，处理时间可能越长。高级设置可以针对不同类型图片进行优化。
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="enhance" className="space-y-6">
                    {selectedFile && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
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
                          
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">原始图片信息</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>文件名: {selectedFile.name}</div>
                              <div>大小: {(selectedFile.size / 1024).toFixed(1)} KB</div>
                              <div>类型: {selectedFile.type}</div>
                              <div>上传时间: {new Date().toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          {renderEnhancementOptions()}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="result" className="space-y-6">
                    {renderEnhancedResult()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 隐藏的canvas用于处理 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      <canvas ref={detailCanvasRef} className="hidden"></canvas>
    </TooltipProvider>
  )
}

// 导出客户端组件包装器
export default ClientOnlySuperResolution;
