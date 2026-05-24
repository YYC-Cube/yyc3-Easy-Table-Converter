"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, ImageIcon, ArrowLeft, Loader2, Layers, RotateCcw, RotateCw, ImagePlus } from "lucide-react"
import Link from "next/link"
import { imageFormats } from "@/lib/constants/imageFormats"
import { convertImage, getImageInfo, convertImageBatch } from "@/lib/utils/imageConverter"
import { useBatchProcessor } from "@/hooks/useBatchProcessor"
import { useHistory } from "@/hooks/useHistory"
import { usePresets } from "@/hooks/usePresets"
import { BatchProcessorPanel } from "@/components/BatchProcessorPanel"
import { HistoryPanel } from "@/components/HistoryPanel"
import { PresetPanel } from "@/components/PresetPanel"

export default function ImageConverter() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [convertedPreview, setConvertedPreview] = useState<string>("")
  const [targetFormat, setTargetFormat] = useState("png")
  const [quality, setQuality] = useState(92)
  const [converting, setConverting] = useState(false)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size: number } | null>(null)
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null)
  const [convertedFileSize, setConvertedFileSize] = useState<number | null>(null)
  const [historyStates, setHistoryStates] = useState<{preview: string, size: number}[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const getCompressionRatio = () => {
    if (!originalFileSize || !convertedFileSize) return '0%'
    const ratio = ((convertedFileSize - originalFileSize) / originalFileSize) * 100
    return ratio > 0 ? `+${ratio.toFixed(1)}%` : `${ratio.toFixed(1)}%`
  }
  
  const handleUndo = () => {
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    setConvertedPreview(historyStates[newIndex].preview)
    setConvertedFileSize(historyStates[newIndex].size)
  }
  
  const handleRedo = () => {
    if (historyIndex >= historyStates.length - 1) return
    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)
    setConvertedPreview(historyStates[newIndex].preview)
    setConvertedFileSize(historyStates[newIndex].size)
  }
  
  const handleDownload = () => {
    if (!convertedPreview) return
    const link = document.createElement("a")
    const format = imageFormats.find((f) => f.value === targetFormat)
    link.href = convertedPreview
    link.download = `converted.${format?.extension || targetFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { tasks, addFiles, removeTask, clearCompleted, clearAll, processBatch } = useBatchProcessor()
  const { history, addHistoryItem, removeHistoryItem, clearHistory } = useHistory("image")
  const { presets, createPreset, deletePreset } = usePresets("image")

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourcePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const info = await getImageInfo(file)
      setImageInfo(info)
    } catch (error) {
      console.error("[v0] 获取图片信息失败:", error)
    }
  }

  const handleConvert = async () => {
    if (!sourceFile) {
      toast({
        title: "请先选择图片",
        description: "请上传要转换的图片文件",
        variant: "destructive",
      })
      return
    }

    setConverting(true)

    try {
      const blob = await convertImage(sourceFile, targetFormat, quality / 100)
      const url = URL.createObjectURL(blob)
      const format = imageFormats.find((f) => f.value === targetFormat)
      
      // 保存原始文件大小
      setOriginalFileSize(sourceFile.size)
      // 设置转换后的预览和大小
      setConvertedPreview(url)
      setConvertedFileSize(blob.size)
      
      // 更新历史记录
      const newHistory = historyStates.slice(0, historyIndex + 1)
      newHistory.push({preview: url, size: blob.size})
      setHistoryStates(newHistory)
      setHistoryIndex(newHistory.length - 1)

      addHistoryItem({
        type: "image",
        input: {
          format: sourceFile.type.split("/")[1],
          fileName: sourceFile.name,
        },
        output: {
          format: targetFormat,
        },
        settings: { quality },
      })

      toast({
        title: "转换成功",
        description: `图片已转换为 ${format?.label} 格式`,
      })
    } catch (error) {
      console.error("[v0] 图片转换失败:", error)
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "图片转换过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setConverting(false)
    }
  }

  const handleBatchSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "无效文件",
        description: "请选择图片文件",
        variant: "destructive",
      })
      return
    }

    addFiles(imageFiles)
    toast({
      title: "已添加到队列",
      description: `${imageFiles.length} 个文件已添加到批量处理队列`,
    })
  }

  const handleBatchProcess = async () => {
    if (tasks.length === 0) {
      toast({
        title: "队列为空",
        description: "请先添加要处理的图片",
        variant: "destructive",
      })
      return
    }

    await processBatch(async (file, onProgress) => {
      return await convertImageBatch(file, targetFormat, quality / 100, onProgress as (progress: number) => void)
    })

    toast({
      title: "批量处理完成",
      description: "所有图片已处理完成",
    })
  }

  const handleBatchDownload = (task: any) => {
    if (!task.result) return

    const url = URL.createObjectURL(task.result)
    const link = document.createElement("a")
    const format = imageFormats.find((f) => f.value === targetFormat)
    link.href = url
    link.download = `${task.file.name.split(".")[0]}.${format?.extension || targetFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCreatePreset = (name: string) => {
    createPreset(name, "image", { targetFormat, quality })
    toast({
      title: "预设已创建",
      description: `预设 "${name}" 已保存`,
    })
  }

  const handleApplyPreset = (preset: any) => {
    setTargetFormat(preset.settings.targetFormat)
    setQuality(preset.settings.quality)
    toast({
      title: "预设已应用",
      description: `已应用预设 "${preset.name}"`,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 动画背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* 返回按钮 */}
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              图片格式转换
            </h1>
            <p className="text-gray-600">支持 PNG、JPG、WEBP、GIF、BMP 等格式互转，支持批量处理</p>
          </div>

          <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="single">单个转换</TabsTrigger>
              <TabsTrigger value="batch">批量处理</TabsTrigger>
            </TabsList>

            {/* 单个转换模式 */}
            <TabsContent value="single">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 上传区域 */}
                    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          上传图片
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                        >
                          {sourcePreview ? (
                            <div className="space-y-4">
                              <img
                                src={sourcePreview || "/placeholder.svg"}
                                alt="预览"
                                className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                              />
                              {imageInfo && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>
                                    尺寸: {imageInfo.width} × {imageInfo.height} px
                                  </p>
                                  <p>大小: {formatFileSize(imageInfo.size)}</p>
                                </div>
                              )}
                              <Button variant="outline" size="sm">
                                重新选择
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="w-8 h-8 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-lg font-medium text-gray-700">点击上传图片</p>
                                <p className="text-sm text-gray-500 mt-1">或拖拽图片到此处</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 转换设置 */}
                    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          转换设置
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label>目标格式</Label>
                          <Select value={targetFormat} onValueChange={setTargetFormat}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {imageFormats.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>图片质量</Label>
                            <span className="text-sm text-gray-600">{quality}%</span>
                          </div>
                          <Slider
                            value={[quality]}
                            onValueChange={(value) => setQuality(value[0])}
                            min={1}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500">质量越高,文件越大,画质越好</p>
                        </div>

                        <Button
                          onClick={handleConvert}
                          disabled={!sourceFile || converting}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          size="lg"
                        >
                          {converting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              转换中...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              转换并下载
                            </>
                          )}
                        </Button>

                        <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                          <p className="font-medium mb-2">使用提示:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• PNG 格式支持透明背景,适合图标和 Logo</li>
                            <li>• JPEG 格式文件较小,适合照片</li>
                            <li>• WEBP 格式兼具质量和体积优势</li>
                            <li>• 转换为 JPEG 时透明背景会变为白色</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 转换结果对比 */}
                  {convertedPreview && (
                    <Card className="mt-6 bg-white/90 backdrop-blur-sm shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                          <ImagePlus className="w-5 h-5" />
                          转换结果对比
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* 双栏对比布局 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">原图</p>
                              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                                <div className="min-h-[200px] flex items-center justify-center bg-slate-50 rounded-lg">
                                  <img
                                    src={sourcePreview}
                                    alt="原始图片"
                                    className="max-w-full max-h-64 mx-auto rounded-md"
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {originalFileSize && formatFileSize(originalFileSize)}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">转换后</p>
                              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                                <div className="min-h-[200px] flex items-center justify-center bg-slate-50 rounded-lg">
                                  <img
                                    src={convertedPreview}
                                    alt="转换后的图片"
                                    className="max-w-full max-h-64 mx-auto rounded-md"
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {convertedFileSize && formatFileSize(convertedFileSize)}
                              </div>
                            </div>
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
                              disabled={historyIndex >= historyStates.length - 1}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <RotateCw className="w-4 h-4" />
                              重做
                            </Button>
                          </div>
                          
                          {/* 大小对比信息 */}
                          {originalFileSize && convertedFileSize && (
                            <div className="bg-slate-50 rounded-lg p-4">
                              <div className="flex justify-center gap-8 text-sm text-gray-600">
                                <div>
                                  <span className="block font-medium text-gray-800">原始大小</span>
                                  <span>{formatFileSize(originalFileSize)}</span>
                                </div>
                                <div>
                                  <span className="block font-medium text-gray-800">转换后大小</span>
                                  <span className={convertedFileSize < originalFileSize ? 'text-green-600' : 'text-orange-600'}>
                                    {formatFileSize(convertedFileSize)}
                                  </span>
                                </div>
                                <div>
                                  <span className="block font-medium text-green-700">变化比例</span>
                                  <span className={getCompressionRatio().includes("-") ? "text-green-600" : "text-orange-600"}>
                                    {getCompressionRatio()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            onClick={handleDownload}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载转换后图片
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* 历史记录 */}
                  <HistoryPanel history={history} onRemove={removeHistoryItem} onClear={clearHistory} />
                </div>

                {/* 预设面板 */}
                <div>
                  <PresetPanel
                    presets={presets}
                    onApply={handleApplyPreset}
                    onDelete={deletePreset}
                    onCreate={handleCreatePreset}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 批量处理模式 */}
            <TabsContent value="batch">
              <div className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      批量图片转换
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <input
                      ref={batchInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBatchSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => batchInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700">点击选择多个图片</p>
                      <p className="text-sm text-gray-500 mt-1">支持同时选择多个文件进行批量转换</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>目标格式</Label>
                        <Select value={targetFormat} onValueChange={setTargetFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {imageFormats.map((format) => (
                              <SelectItem key={format.value} value={format.value}>
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>图片质量</Label>
                          <span className="text-sm text-gray-600">{quality}%</span>
                        </div>
                        <Slider
                          value={[quality]}
                          onValueChange={(value) => setQuality(value[0])}
                          min={1}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleBatchProcess}
                      disabled={tasks.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      开始批量转换
                    </Button>
                  </CardContent>
                </Card>

                {/* 批量处理队列 */}
                <BatchProcessorPanel
                  tasks={tasks}
                  onRemoveTask={removeTask}
                  onClearCompleted={clearCompleted}
                  onClearAll={clearAll}
                  onDownload={handleBatchDownload}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
