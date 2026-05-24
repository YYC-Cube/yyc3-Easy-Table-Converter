"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Sparkles, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { applyFilter } from "@/lib/utils/imageProcessor"

const filters = [
  { id: "grayscale", name: "黑白", description: "经典黑白效果" },
  { id: "sepia", name: "复古", description: "怀旧复古色调" },
  { id: "blur", name: "模糊", description: "柔和模糊效果" },
  { id: "sharpen", name: "锐化", description: "增强清晰度" },
  { id: "invert", name: "反色", description: "颜色反转" },
  { id: "vintage", name: "老照片", description: "老照片风格" },
] as const

export default function ImageFilterPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [filteredPreview, setFilteredPreview] = useState<string>("")
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]["id"] | null>(null)
  const [processing, setProcessing] = useState(false)
  const [filteredBlob, setFilteredBlob] = useState<Blob | null>(null)
  const [fileSize, setFileSize] = useState<{ original: number; processed: number }>({ original: 0, processed: 0 })
  const [history, setHistory] = useState<{ filterId: (typeof filters)[number]["id"]; blob: Blob; preview: string }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
    setFileSize({ original: file.size, processed: file.size })
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourcePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setFilteredPreview("")
    setFilteredBlob(null)
    setSelectedFilter(null)
    setHistory([])
    setHistoryIndex(-1)
  }

  const processImage = async (file: File, filterId: (typeof filters)[number]["id"]): Promise<{ blob: Blob; url: string }> => {
    try {
      const blob = await applyFilter(file, filterId)
      const url = URL.createObjectURL(blob)
      return { blob, url }
    } catch (error) {
      console.error("处理图片失败:", error)
      throw error
    }
  }

  const addToHistory = (filterId: (typeof filters)[number]["id"], blob: Blob, preview: string) => {
    // 清除当前索引之后的历史记录（如果有的话）
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ filterId, blob, preview })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleApplyFilter = async (filterId: (typeof filters)[number]["id"]) => {
    if (!sourceFile) {
      toast({
        title: "请先选择图片",
        description: "请上传要应用滤镜的图片文件",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    setSelectedFilter(filterId)

    try {
      let result;
      
      // 如果历史记录中有当前滤镜效果，直接使用历史记录
      if (historyIndex >= 0 && history[historyIndex].filterId === filterId) {
        result = {
          blob: history[historyIndex].blob,
          url: history[historyIndex].preview
        };
      } else {
        // 否则处理新的滤镜效果
        result = await processImage(sourceFile, filterId)
        addToHistory(filterId, result.blob, result.url)
      }
      
      setFilteredBlob(result.blob)
      setFilteredPreview(result.url)
      setFileSize(prev => ({ ...prev, processed: result.blob.size }))

      const filterName = filters.find((f) => f.id === filterId)?.name
      toast({
        title: "应用成功",
        description: `${filterName}滤镜已应用`,
      })
    } catch (error) {
      console.error("应用滤镜失败:", error)
      toast({
        title: "应用失败",
        description: error instanceof Error ? error.message : "应用滤镜过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const prevState = history[newIndex]
      setHistoryIndex(newIndex)
      setFilteredBlob(prevState.blob)
      setFilteredPreview(prevState.preview)
      setSelectedFilter(prevState.filterId)
      setFileSize(prev => ({ ...prev, processed: prevState.blob.size }))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]
      setHistoryIndex(newIndex)
      setFilteredBlob(nextState.blob)
      setFilteredPreview(nextState.preview)
      setSelectedFilter(nextState.filterId)
      setFileSize(prev => ({ ...prev, processed: nextState.blob.size }))
    }
  }

  const handleDownload = () => {
    if (!filteredBlob || !sourceFile) return

    const url = URL.createObjectURL(filteredBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `filtered_${sourceFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl mb-4 shadow-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-pink-800 to-rose-800 bg-clip-text text-transparent mb-2">
              滤镜效果
            </h1>
            <p className="text-gray-600">应用各种滤镜效果：黑白、复古、模糊、锐化等</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 hover:bg-pink-50/50 transition-all"
                >
                  {sourcePreview ? (
                    <div className="space-y-4">
                      <img
                        src={sourcePreview || "/placeholder.svg"}
                        alt="原图"
                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {sourceFile ? `${(fileSize.original / 1024).toFixed(1)} KB` : ''}
                        </span>
                        <Button variant="outline" size="sm">
                          重新选择
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">点击上传图片</p>
                        <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG 等格式</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">选择滤镜效果</p>
                  <div className="grid grid-cols-2 gap-2">
                    {filters.map((filter) => (
                      <Button
                        key={filter.id}
                        onClick={() => handleApplyFilter(filter.id)}
                        disabled={!sourceFile || processing}
                        variant={selectedFilter === filter.id ? "default" : "outline"}
                        className="h-auto py-3 flex flex-col items-start"
                      >
                        <span className="font-medium">{filter.name}</span>
                        <span className="text-xs text-gray-500">{filter.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {processing && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                    <span className="ml-2 text-sm text-gray-600">处理中...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  处理结果对比
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {filteredPreview ? (
                  <div className="space-y-6">
                    {/* 双栏对比布局 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">原图</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={sourcePreview || "/placeholder.svg"}
                            alt="原始图片"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {sourceFile ? `${(fileSize.original / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">应用滤镜后 ({selectedFilter ? filters.find(f => f.id === selectedFilter)?.name : ''})</p>
                        <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                          <img
                            src={filteredPreview || "/placeholder.svg"}
                            alt="滤镜后"
                            className="max-w-full max-h-[300px] mx-auto rounded-md"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {filteredBlob ? `${(fileSize.processed / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-blue-700">提示: 滤镜效果可以通过上方的历史操作按钮进行撤销和重做，尝试不同的风格来找到最适合的效果。</p>
                    </div>
                        
                      {/* 历史操作控制 */}
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={handleUndo}
                          disabled={historyIndex <= 0}
                          variant="outline"
                        >
                          撤销
                        </Button>
                        <Button
                          onClick={handleRedo}
                          disabled={historyIndex >= history.length - 1}
                          variant="outline"
                        >
                          重做
                        </Button>
                      </div>
                        <Button
                          onClick={handleDownload}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                          size="lg"
                        >
                        <Download className="w-4 h-4 mr-2" />
                        下载图片
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <Sparkles className="w-16 h-16 mb-4" />
                      <p>选择滤镜后效果将显示在这里</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
