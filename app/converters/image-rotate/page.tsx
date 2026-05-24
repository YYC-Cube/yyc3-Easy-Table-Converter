"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, RotateCw, ArrowLeft, FlipHorizontal, FlipVertical, RotateCcw, ImagePlus } from "lucide-react"
import Link from "next/link"

export default function ImageRotatePage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState("")
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedPreview, setProcessedPreview] = useState("")
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [processedFileSize, setProcessedFileSize] = useState<number | null>(null)
  const [history, setHistory] = useState<Array<{ rotation: number; flipH: boolean; flipV: boolean; preview: string; size: number }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" })
      return
    }

    setSourceFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setSourcePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    
    // 重置历史记录
    setFileSize(file.size)
    setProcessedPreview('')
    setProcessedFileSize(null)
    const initialState = { rotation: 0, flipH: false, flipV: false, preview: sourcePreview, size: file.size }
    setHistory([initialState])
    setHistoryIndex(0)
  }

  const handleRotate = async (degrees: number) => {
    const newRotation = (rotation + degrees) % 360
    setRotation(newRotation)
    await processImage(newRotation, flipH, flipV)
  }

  const handleFlipHorizontal = async () => {
    const newFlipH = !flipH
    setFlipH(newFlipH)
    await processImage(rotation, newFlipH, flipV)
  }

  const handleFlipVertical = async () => {
    const newFlipV = !flipV
    setFlipV(newFlipV)
    await processImage(rotation, flipH, newFlipV)
  }

  const processImage = async (newRotation: number, newFlipH: boolean, newFlipV: boolean) => {
    if (!sourceFile || !sourcePreview) return
    
    setProcessing(true)
    try {
      const result = await rotateImage(sourcePreview, newRotation, newFlipH, newFlipV)
      
      // 添加到历史记录
      addToHistory(newRotation, newFlipH, newFlipV, result.preview, result.size)
    } catch (error) {
      toast({ title: "处理失败", variant: "destructive" })
      console.error("图片处理失败:", error)
    } finally {
      setProcessing(false)
    }
  }

  const rotateImage = async (imageSrc: string, rotation: number, flipH: boolean, flipV: boolean): Promise<{ preview: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = imageSrc
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        const rad = (rotation * Math.PI) / 180
        const sin = Math.abs(Math.sin(rad))
        const cos = Math.abs(Math.cos(rad))

        canvas.width = img.width * cos + img.height * sin
        canvas.height = img.width * sin + img.height * cos

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(rad)
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("无法创建处理后的图片"))
            return
          }
          
          const preview = URL.createObjectURL(blob)
          setProcessedPreview(preview)
          setProcessedFileSize(blob.size)
          
          resolve({ preview, size: blob.size })
        }, "image/png")
      }
      img.onerror = () => reject(new Error("图片加载失败"))
    })
  }

  const addToHistory = (rotation: number, flipH: boolean, flipV: boolean, preview: string, size: number) => {
    // 删除当前索引之后的历史记录
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ rotation, flipH, flipV, preview, size })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const prevState = history[newIndex]
      setRotation(prevState.rotation)
      setFlipH(prevState.flipH)
      setFlipV(prevState.flipV)
      setProcessedPreview(prevState.preview)
      setProcessedFileSize(prevState.size)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const nextState = history[newIndex]
      setRotation(nextState.rotation)
      setFlipH(nextState.flipH)
      setFlipV(nextState.flipV)
      setProcessedPreview(nextState.preview)
      setProcessedFileSize(nextState.size)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getCompressionRatio = (): string => {
    if (!fileSize || !processedFileSize) return "0%"
    const ratio = ((fileSize - processedFileSize) / fileSize) * 100
    return `${ratio.toFixed(1)}%`
  }

  const handleDownload = () => {
    if (!processedPreview) {
      toast({ title: "请先处理图片", variant: "destructive" })
      return
    }
    
    const link = document.createElement("a")
    link.href = processedPreview
    link.download = `rotated-${rotation}deg.png`
    link.click()
    toast({ title: "下载成功" })
  }

  const handleReset = async () => {
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    await processImage(0, false, false)
  }

  const previewStyle = {
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transition: "transform 0.3s ease",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
              <RotateCw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
              图片旋转翻转
            </h1>
            <p className="text-slate-600">旋转、翻转图片,支持任意角度</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                >
                  {sourcePreview ? (
                    <div className="overflow-hidden">
                      <img
                        src={sourcePreview || "/placeholder.svg"}
                        alt="预览"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        style={previewStyle}
                      />
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
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5" />
                  旋转翻转
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">旋转角度</p>
                  <div className="grid grid-cols-4 gap-2">
                    <Button onClick={() => handleRotate(90)} variant="outline" size="sm">
                      90°
                    </Button>
                    <Button onClick={() => handleRotate(180)} variant="outline" size="sm">
                      180°
                    </Button>
                    <Button onClick={() => handleRotate(270)} variant="outline" size="sm">
                      270°
                    </Button>
                    <Button onClick={() => handleRotate(-90)} variant="outline" size="sm">
                      -90°
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">当前角度: {rotation}°</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">翻转</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleFlipHorizontal} variant={flipH ? "default" : "outline"} size="sm">
                      <FlipHorizontal className="w-4 h-4 mr-2" />
                      水平翻转
                    </Button>
                    <Button onClick={handleFlipVertical} variant={flipV ? "default" : "outline"} size="sm">
                      <FlipVertical className="w-4 h-4 mr-2" />
                      垂直翻转
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  disabled={processing}
                  variant="outline"
                  className="w-full"
                >
                  重置
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* 处理结果区域 - 双栏对比 */}
          {processedPreview && (
            <Card className="mt-6 bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" />
                  处理结果对比
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* 双栏对比布局 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full">
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">原图</p>
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                        <div className="relative min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={sourcePreview}
                            alt="原始图片"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            0°
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">处理后 (当前角度: {rotation}° {flipH ? 'H' : ''}{flipV ? 'V' : ''})</p>
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                        <div className="relative min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={processedPreview}
                            alt="处理后的图片"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {rotation}° {flipH ? 'H' : ''}{flipV ? 'V' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 提示信息 */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-700">您可以通过左侧面板调整旋转角度和翻转方向。使用撤销/重做按钮可以回溯操作历史。</p>
                  </div>
                  
                  {/* 历史操作控制 */}
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      撤销
                    </Button>
                    <Button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      重做
                    </Button>
                  </div>
                  
                  {/* 文件大小对比 */}
                  {fileSize && processedFileSize && (
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>原始大小:</span>
                        <span>{formatFileSize(fileSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 mt-2">
                        <span>处理后大小:</span>
                        <span>{formatFileSize(processedFileSize)}</span>
                      </div>
                      <div className="w-3/4 mx-auto bg-slate-200 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full" 
                          style={{ width: getCompressionRatio() }}
                        ></div>
                      </div>
                      <div className="text-sm text-slate-500 text-center">
                        变化: {getCompressionRatio()}
                      </div>
                    </div>
                  )}
                  
                  {/* 下载按钮 */}
                  <Button 
                    onClick={handleDownload}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载图片
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
