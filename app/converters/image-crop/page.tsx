"use client"

import type React from "react"
import type { Crop as CropType } from "react-image-crop"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Tabs components removed as they're not being used
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Crop, ArrowLeft, Download, RotateCw, History } from "lucide-react"
import Link from "next/link"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

export default function ImageCropPage() {
  // 基本状态
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState("")
  const [processedPreview, setProcessedPreview] = useState("")
  const [processing, setProcessing] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [processedSize, setProcessedSize] = useState(0)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()
  
  // 裁剪相关状态
  const [crop, setCrop] = useState<CropType>({
    unit: "px",
    x: 0,
    y: 0,
    width: 300,
    height: 300
    // aspect 属性现在通过 ReactCrop 组件的 aspectRatio 属性传递
  })
  const [aspectRatio, setAspectRatio] = useState<number | null>(1)
  const [cropComplete, setCropComplete] = useState(false)
  // 添加实时预览相关状态
  
  // 历史记录
  const [history, setHistory] = useState<Blob[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // 预设比例选项
  const aspectRatios = [
    { value: null, label: "自由裁剪" },
    { value: 1, label: "1:1 方形" },
    { value: 16/9, label: "16:9 宽屏" },
    { value: 4/3, label: "4:3 标准" },
    { value: 3/2, label: "3:2 照片" },
    { value: 9/16, label: "9:16 竖屏" }
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" })
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
    setCropComplete(false)
    setHistory([])
    setHistoryIndex(-1)
  }
  
  // 处理比例变化
  const handleAspectRatioChange = (ratio: number | null) => {
    setAspectRatio(ratio)
    if (ratio && imgRef.current && crop.width && crop.height) {
      // 创建一个新的裁剪框，保持宽高比
      // 修复 makeAspectCrop 函数调用，确保unit类型为'%'
      const percentCrop = { ...crop, unit: '%' as const }
      const newCrop = makeAspectCrop(
        percentCrop,
        ratio,
        imgRef.current.offsetWidth || 300,
        imgRef.current.offsetHeight || 300
      )
      // 转回原始的unit类型
      const finalCrop = { ...newCrop, unit: crop.unit }
      setCrop(finalCrop)
    } else {
      // 自由裁剪，移除宽高比限制
      const { width, height, x, y, unit } = crop
      setCrop({ width, height, x, y, unit })
    }
  }
  
  // 处理裁剪完成
  const handleCropComplete = async (_croppedArea: CropType, croppedAreaPixels: CropType) => {
    setCropComplete(true)
    
    // 实时生成预览
    if (sourceFile && croppedAreaPixels.width && croppedAreaPixels.height) {
      try {
        // 移除未使用的变量，因为预览功能已被禁用
      } catch (error) {
        console.error("生成预览失败:", error)
      }
    }
  }
  
  // 执行裁剪
  const handlePerformCrop = async () => {
    if (!sourceFile || !cropComplete) {
      toast({ title: "请先调整裁剪区域", variant: "destructive" })
      return
    }
    
    setProcessing(true)
    
    try {
      // 使用croppedAreaPixels中的值而不是crop中的值
      // 从croppedAreaPixels获取裁剪参数，确保使用像素坐标
      const cropData = crop as { x?: number; y?: number; width?: number; height?: number }
      const x = Math.round(cropData.x || 0)
      const y = Math.round(cropData.y || 0)
      const width = Math.round(cropData.width || 0)
      const height = Math.round(cropData.height || 0)
      
      // 验证参数
      if (width <= 0 || height <= 0) {
        throw new Error("无效的裁剪尺寸")
      }
      
      // 调用裁剪函数
      const blob = await cropImage(sourceFile, x, y, width, height)
      setProcessedBlob(blob)
      setProcessedSize(blob.size)
      
      // 生成预览 URL
      const url = URL.createObjectURL(blob)
      setProcessedPreview(url)
      
      // 添加到历史记录
      addToHistory(blob)
      
      toast({ title: "裁剪成功", description: `裁剪图片尺寸: ${width}x${height}px` })
    } catch (error) {
      console.error("裁剪失败:", error)
      toast({
        title: "裁剪失败",
        description: error instanceof Error ? error.message : "图片裁剪过程中出现错误",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }
  
  // 添加到历史记录
  const addToHistory = (blob: Blob) => {
    // 移除当前索引之后的历史记录
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(blob)
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
  
  // 下载处理后的图片
  const handleDownload = () => {
    if (!processedBlob || !sourceFile) return

    const url = URL.createObjectURL(processedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cropped_${sourceFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }
  
  const compressionRatio = originalSize > 0 && processedSize > 0 ? ((1 - processedSize / originalSize) * 100).toFixed(1) : "0"

  // 图片裁剪工具函数
  const cropImage = async (file: File, x: number, y: number, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('无法创建画布上下文'))
            return
          }
          
          // 设置画布尺寸为裁剪尺寸
          canvas.width = width
          canvas.height = height
          
          // 绘制裁剪区域
          ctx.drawImage(
            img,
            x, y, width, height, // 源区域
            0, 0, width, height  // 目标区域
          )
          
          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('无法创建裁剪后的图片'))
              }
            },
            file.type || 'image/png',
            1.0 // 质量
          )
        }
        img.onerror = () => reject(new Error('图片加载失败'))
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
              <Crop className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
              图片裁剪
            </h1>
            <p className="text-slate-600">自由裁剪图片,支持多种固定比例</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 上传和设置 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                >
                  {sourcePreview ? (
                    <div className="relative max-h-96 overflow-hidden rounded-lg">
                      <ReactCrop
                        crop={crop}
                        onChange={(crop) => setCrop(crop)}
                        onComplete={handleCropComplete}
                        {...(aspectRatio !== null && { aspect: aspectRatio })}
                        className="max-w-full max-h-96 mx-auto"
                      >
                        <img
                          ref={imgRef}
                          src={sourcePreview}
                          alt="上传的图片"
                          className="max-w-full max-h-96 mx-auto"
                        />
                      </ReactCrop>
                    </div>
                  ) : (
                    <div className="space-y-4">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-8 h-8 text-purple-600" />
                          </div>
                          <p className="text-lg font-medium text-slate-700">点击上传图片</p>
                        </div>
                  )}
                </div>
                
                {/* 裁剪设置 */}
                {sourcePreview && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>选择裁剪比例</Label>
                      <Select
                        value={aspectRatio?.toString() || 'null'}
                        onValueChange={(value) => handleAspectRatioChange(value === 'null' ? null : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择比例" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value?.toString() || 'free'} value={ratio.value?.toString() || 'null'}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>裁剪区域坐标和大小</Label>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>
                          <span>X: </span>
                          <span className="font-medium">{Math.round(crop.x || 0)}</span>
                        </div>
                        <div>
                          <span>Y: </span>
                          <span className="font-medium">{Math.round(crop.y || 0)}</span>
                        </div>
                        <div>
                          <span>宽度: </span>
                          <span className="font-medium">{Math.round(crop.width || 0)}px</span>
                        </div>
                        <div>
                          <span>高度: </span>
                          <span className="font-medium">{Math.round(crop.height || 0)}px</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handlePerformCrop}
                      disabled={!sourcePreview || !cropComplete || processing}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                    >
                      {processing ? (
                        <>处理中...</>
                      ) : (
                        <>
                          <Crop className="w-4 h-4 mr-2" />
                          执行裁剪
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 处理结果 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5" />
                处理结果对比
              </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {processedPreview ? (
                  <div className="space-y-6">
                    {/* 双栏对比布局 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">原图</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={sourcePreview || ''}
                            alt="原始图片"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-2 text-center">
                          {formatFileSize(originalSize)}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">裁剪后</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={processedPreview || ''}
                            alt="裁剪后"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-2 text-center">
                          {formatFileSize(processedSize)}
                        </div>
                      </div>
                    </div>

                    {/* 提示信息区域 */}
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 border border-blue-100">
                      💡 提示：在左侧面板中调整裁剪区域，可以选择不同的宽高比。完成后点击执行裁剪按钮。
                    </div>

                    {/* 历史操作控制 */}
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <History className="w-4 h-4" />
                        撤销
                      </Button>
                      <Button 
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <RotateCw className="w-4 h-4" />
                        重做
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="flex justify-center gap-8 text-sm text-slate-600">
                        <div>
                          <span className="block font-medium text-slate-800">原始大小</span>
                          <span>{formatFileSize(originalSize)}</span>
                        </div>
                        <div>
                          <span className="block font-medium text-slate-800">处理后大小</span>
                          <span className={`font-medium ${processedSize < originalSize ? 'text-green-600' : 'text-orange-600'}`}>
                            {formatFileSize(processedSize)}
                          </span>
                        </div>
                        {processedSize > 0 && (
                          <div>
                            <span className="block font-medium text-slate-800">{processedSize < originalSize ? '减少' : '增加'}</span>
                            <span className={`font-medium ${processedSize < originalSize ? 'text-green-600' : 'text-orange-600'}`}>
                              {compressionRatio}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                      size="lg"
                      disabled={!processedBlob}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载裁剪图片
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                    <Crop className="w-16 h-16 mb-4" />
                    <p>裁剪结果将显示在这里</p>
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

// 引入必要的图标
const ImagePlus = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="12" x2="12" y1="8" y2="16" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  )
}
