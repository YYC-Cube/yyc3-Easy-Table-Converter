"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Minimize2, ArrowLeft, Loader2, ImagePlus, Palette, Type, RotateCcw, ImageOff, RotateCw } from "lucide-react"
import Link from "next/link"
import { compressImage, enhanceImage, addWatermark, applyFilter, rotateImage, flipImage } from "@/lib/utils/imageProcessor"

export default function ImageCompressPage() {
  // 基本状态
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [processedPreview, setProcessedPreview] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [processedSize, setProcessedSize] = useState(0)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // 功能状态
  const [activeTab, setActiveTab] = useState("compress")
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(1920)
  const [maxHeight, setMaxHeight] = useState(1080)
  
  // 图片增强参数
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  
  // 滤镜参数
  const [filterType, setFilterType] = useState<"grayscale" | "sepia" | "blur" | "sharpen" | "invert" | "vintage">("grayscale")
  
  // 水印参数
  const [watermarkText, setWatermarkText] = useState("")
  const [watermarkPosition, setWatermarkPosition] = useState<"center" | "bottom-right" | "top-left" | "top-right" | "bottom-left">('bottom-right')
  
  // 旋转参数
  const [rotation, setRotation] = useState(0)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  
  // 历史记录
  const [history, setHistory] = useState<Blob[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // 历史记录最大数量限制
  const MAX_HISTORY_SIZE = 50;
  
  // 滤镜预设
  const filters = [
    { id: "normal", name: "原图" },
    { id: "grayscale", name: "黑白" },
    { id: "sepia", name: "复古" },
    { id: "invert", name: "反色" },
    { id: "bright", name: "明亮" },
    { id: "warm", name: "暖色" },
    { id: "cool", name: "冷色" },
    { id: "vintage", name: "怀旧" }
  ]
  
  // 水印位置
  const watermarkPositions = [
    { value: "top-left", label: "左上角" },
    { value: "top-right", label: "右上角" },
    { value: "bottom-left", label: "左下角" },
    { value: "bottom-right", label: "右下角" },
    { value: "center", label: "居中" }
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      })
      return
    }

    setSourceFile(file)
    setOriginalSize(file.size)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourcePreview(e.target?.result as string)
      setProcessedPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    // 重置状态
    setProcessedBlob(null)
    setProcessedSize(0)
    setRotation(0)
    setFlipHorizontal(false)
    setHistory([])
    setHistoryIndex(-1)
  }
  
  // 添加到历史记录
  const addToHistory = (blob: Blob) => {
    // 移除当前索引之后的历史记录
    let newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(blob)
    
    // 限制历史记录数量，防止内存占用过高
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory = newHistory.slice(-MAX_HISTORY_SIZE);
      console.log(`历史记录已自动清理，当前保留 ${MAX_HISTORY_SIZE} 条记录`);
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }
  
  // 撤销操作
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const blob = history[newIndex]
      setProcessedBlob(blob)
      setProcessedSize(blob.size)
      const url = URL.createObjectURL(blob)
      setProcessedPreview(url)
      toast({ title: "已撤销操作" })
    }
  }
  
  // 重做操作
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const blob = history[newIndex]
      setProcessedBlob(blob)
      setProcessedSize(blob.size)
      const url = URL.createObjectURL(blob)
      setProcessedPreview(url)
      toast({ title: "已重做操作" })
    }
  }

  // 压缩图片
  const handleCompress = async () => {
    await processImage(async (file) => {
      return await compressImage(file, quality / 100, maxWidth, maxHeight)
    }, "压缩")
  }
  
  // 实时预览压缩效果（可选实现）
  const [previewCompressed, setPreviewCompressed] = useState<string>("")
  
  useEffect(() => {
    const generatePreview = async () => {
      if (!sourceFile || activeTab !== "compress") return
      
      try {
        const blob = await compressImage(sourceFile, quality / 100, maxWidth, maxHeight)
        const url = URL.createObjectURL(blob)
        setPreviewCompressed(url)
      } catch (error) {
        console.error("生成预览失败:", error)
      }
    }
    
    // 添加防抖处理
    const timer = setTimeout(generatePreview, 500)
    return () => clearTimeout(timer)
  }, [sourceFile, quality, maxWidth, maxHeight, activeTab])
  
  // 组件卸载时清理URL
  useEffect(() => {
    return () => {
      if (previewCompressed) {
        URL.revokeObjectURL(previewCompressed)
      }
    }
  }, [previewCompressed])
  
  // 增强图片
  const handleEnhance = async () => {
    await processImage(async (file) => {
      return await enhanceImage(file, brightness / 100, contrast / 100, saturation / 100)
    }, "增强")
  }
  
  // 应用滤镜
  const handleApplyFilter = async () => {
    await processImage(async (file) => {
      return await applyFilter(file, filterType)
    }, "滤镜")
  }
  
  // 添加水印
  const handleAddWatermark = async () => {
    if (!watermarkText.trim()) {
      toast({
        title: "请输入水印文字",
        variant: "destructive",
      })
      return
    }
    
    await processImage(async (file) => {
      return await addWatermark(file, watermarkText, watermarkPosition)
    }, "水印")
  }
  
  // 旋转图片
  const handleRotate = async () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    
    await processImage(async (file) => {
      return await rotateImage(file, 90)
    }, "旋转")
  }
  
  // 水平翻转
  const handleFlip = async () => {
    setFlipHorizontal(!flipHorizontal)
    
    await processImage(async (file) => {
      return await flipImage(file, 'horizontal')
    }, "翻转")
  }
  
  // 通用图片处理函数
  const processImage = async (processor: (file: File) => Promise<Blob>, actionName: string) => {
    if (!sourceFile && !processedBlob) {
      toast({
        title: "请先选择图片",
        variant: "destructive",
      })
      return false
    }

    setProcessing(true)

    try {
      const inputFile = processedBlob || sourceFile!
      // 确保传入的是File类型
      const fileToProcess = inputFile instanceof Blob && !(inputFile instanceof File)
        ? new File([inputFile], sourceFile ? sourceFile.name : 'processed-image.jpg', { type: inputFile.type })
        : (inputFile)
      const blob = await processor(fileToProcess)
      setProcessedBlob(blob)
      setProcessedSize(blob.size)
      const url = URL.createObjectURL(blob)
      setProcessedPreview(url)
      
      // 添加到历史记录
      addToHistory(blob)

      toast({
        title: `${actionName}成功`,
        description: sourceFile ? `文件大小从 ${formatFileSize(originalSize)} 变为 ${formatFileSize(blob.size)}` : `${actionName}处理完成`,
      })
      
      return true
    } catch (error) {
      console.error(`${actionName}失败:`, error)
      toast({
        title: `${actionName}失败`,
        description: error instanceof Error ? error.message : `图片${actionName}过程中出现错误`,
        variant: "destructive",
      })
      return false
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedBlob || !sourceFile) return

    const url = URL.createObjectURL(processedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${activeTab}_${sourceFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const compressionRatio = originalSize > 0 && processedSize > 0 ? ((1 - processedSize / originalSize) * 100).toFixed(1) : "0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl mb-4 shadow-2xl">
              <Minimize2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-teal-800 bg-clip-text text-transparent mb-2">
              图片压缩优化
            </h1>
            <p className="text-gray-600">智能压缩图片大小,保持画质,减少存储空间</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 上传和设置 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all"
                >
                  {sourcePreview ? (
                    <div className="space-y-4">
                      <img
                        src={sourcePreview || "/placeholder.svg"}
                        alt="原图"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <div className="text-sm text-gray-600">
                        <p>原始大小: {formatFileSize(originalSize)}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        重新选择
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">点击上传图片</p>
                        <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、WEBP 等格式</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 功能选项卡 */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="compress" className="flex items-center gap-1">
                      <Minimize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">压缩</span>
                    </TabsTrigger>
                    <TabsTrigger value="enhance" className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      <span className="hidden sm:inline">增强</span>
                    </TabsTrigger>
                    <TabsTrigger value="filter" className="flex items-center gap-1">
                      <ImagePlus className="w-4 h-4" />
                      <span className="hidden sm:inline">滤镜</span>
                    </TabsTrigger>
                    <TabsTrigger value="watermark" className="flex items-center gap-1">
                      <Type className="w-4 h-4" />
                      <span className="hidden sm:inline">水印</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* 压缩设置 */}
                  <TabsContent value="compress" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>压缩质量</Label>
                        <span className="text-sm text-gray-600">{quality}%</span>
                      </div>
                      <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} min={1} max={100} step={1} />
                      <p className="text-xs text-gray-500">质量越低,文件越小,但画质会下降</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最大宽度</Label>
                        <span className="text-sm text-gray-600">{maxWidth}px</span>
                      </div>
                      <Slider
                        value={[maxWidth]}
                        onValueChange={(v) => setMaxWidth(v[0])}
                        min={100}
                        max={4000}
                        step={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最大高度</Label>
                        <span className="text-sm text-gray-600">{maxHeight}px</span>
                      </div>
                      <Slider
                        value={[maxHeight]}
                        onValueChange={(v) => setMaxHeight(v[0])}
                        min={100}
                        max={4000}
                        step={10}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* 增强设置 */}
                  <TabsContent value="enhance" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>亮度</Label>
                        <span className="text-sm text-gray-600">{brightness}%</span>
                      </div>
                      <Slider value={[brightness]} onValueChange={(v) => setBrightness(v[0])} min={0} max={200} step={1} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>对比度</Label>
                        <span className="text-sm text-gray-600">{contrast}%</span>
                      </div>
                      <Slider value={[contrast]} onValueChange={(v) => setContrast(v[0])} min={0} max={200} step={1} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>饱和度</Label>
                        <span className="text-sm text-gray-600">{saturation}%</span>
                      </div>
                      <Slider value={[saturation]} onValueChange={(v) => setSaturation(v[0])} min={0} max={200} step={1} />
                    </div>
                  </TabsContent>
                  
                  {/* 滤镜设置 */}
                  <TabsContent value="filter" className="space-y-4">
                    <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择滤镜" />
                      </SelectTrigger>
                      <SelectContent>
                        {filters.map(filter => (
                          <SelectItem key={filter.id} value={filter.id}>{filter.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-3 gap-2">
                      {filters.map(filter => (
                        <div 
                            key={filter.id}
                           onClick={() => setFilterType(filter.id as any)}
                            className={`p-2 text-center rounded cursor-pointer transition-all ${filterType === filter.id ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'}`}
                          >
                          <span className="text-sm">{filter.name}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {/* 水印设置 */}
                  <TabsContent value="watermark" className="space-y-4">
                    <div className="space-y-2">
                      <Label>水印文字</Label>
                      <Input 
                        placeholder="请输入水印文字" 
                        value={watermarkText} 
                        onChange={(e) => setWatermarkText(e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>水印位置</Label>
                      <Select value={watermarkPosition} onValueChange={(value) => setWatermarkPosition(value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择位置" />
                        </SelectTrigger>
                        <SelectContent>
                          {watermarkPositions.map(pos => (
                            <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* 基本图像操作 */}
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleRotate}
                    disabled={!sourceFile || processing}
                    variant="secondary"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    旋转
                  </Button>
                  <Button 
                    onClick={handleFlip}
                    disabled={!sourceFile || processing}
                    variant="secondary"
                    size="sm"
                  >
                    <ImageOff className="w-4 h-4 mr-1" />
                    翻转
                  </Button>
                </div>

                {/* 主要操作按钮 */}
                <Button
                  onClick={() => {
                    switch(activeTab) {
                      case 'compress':
                        handleCompress();
                        break;
                      case 'enhance':
                        handleEnhance();
                        break;
                      case 'filter':
                        handleApplyFilter();
                        break;
                      case 'watermark':
                        handleAddWatermark();
                        break;
                    }
                  }}
                  disabled={!sourceFile || processing}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      {activeTab === 'compress' && <Minimize2 className="w-4 h-4 mr-2" />}
                      {activeTab === 'enhance' && <Palette className="w-4 h-4 mr-2" />}
                      {activeTab === 'filter' && <ImagePlus className="w-4 h-4 mr-2" />}
                      {activeTab === 'watermark' && <Type className="w-4 h-4 mr-2" />}
                      开始{activeTab === 'compress' ? '压缩' : activeTab === 'enhance' ? '增强' : activeTab === 'filter' ? '应用滤镜' : '添加水印'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 预览和下载 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" />
                  处理结果对比
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* 历史记录操作按钮 */}
                <div className="flex gap-2 mb-4 justify-center">
                  <Button 
                    onClick={handleUndo} 
                    disabled={historyIndex <= 0}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    撤销
                  </Button>
                  <Button 
                    onClick={handleRedo} 
                    disabled={historyIndex >= history.length - 1}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <RotateCw className="w-4 h-4" />
                    重做
                  </Button>
                </div>
                {processedPreview ? (
                  <div className="space-y-6">
                    {/* 双栏预览 - 原图和处理后对比 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">原图</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={sourcePreview}
                            alt="原图"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {formatFileSize(originalSize)}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">处理后</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={processedPreview}
                            alt="处理后的图片"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {formatFileSize(processedSize)}
                          {compressionRatio !== "0" && (
                            <span className="ml-2 text-green-600">↓{compressionRatio}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* 提示信息 */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-blue-700">
                        {activeTab === 'compress' ? '💡 拖动滑块可实时预览压缩效果' : 
                         activeTab === 'enhance' ? '💡 通过调整亮度、对比度和饱和度参数优化图片效果' :
                         activeTab === 'filter' ? '💡 选择不同的滤镜风格，为图片添加艺术效果' :
                         '💡 输入文字并选择位置，为图片添加自定义水印'}
                      </p>
                    </div>
                    
                    {/* 实时预览功能提示 */}
                    {activeTab === 'compress' && previewCompressed && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                        💡 拖动滑块可实时预览压缩效果
                      </div>
                    )}
                    
                    {/* 大小对比信息 */}
                    {originalSize > 0 && processedSize > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="flex justify-center gap-8 text-sm text-slate-600">
                          <div>
                            <span className="block font-medium text-slate-800">原始大小</span>
                            <span>{formatFileSize(originalSize)}</span>
                          </div>
                          <div>
                            <span className="block font-medium text-slate-800">处理后大小</span>
                            <span className="text-green-600">
                              {formatFileSize(processedSize)}
                            </span>
                          </div>
                          <div>
                            <span className="block font-medium text-green-700">节省空间</span>
                            <span className="text-green-600">
                              ↓{compressionRatio}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载优化图片
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <ImagePlus className="w-16 h-16 mb-4" />
                    <p>处理结果将显示在这里</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
