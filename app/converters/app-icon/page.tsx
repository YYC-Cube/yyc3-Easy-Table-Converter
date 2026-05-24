"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Smartphone, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { generateAppIcons } from "@/lib/utils/imageProcessor"
import { iosIconSizes, androidIconSizes, webIconSizes } from "@/lib/constants/appIconSizes"
import JSZip from "jszip"

export default function AppIconGeneratorPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [generating, setGenerating] = useState(false)
  const [generatedIcons, setGeneratedIcons] = useState<Map<number, Blob>>(new Map())
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
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourcePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setGeneratedIcons(new Map())
  }

  const handleGenerate = async (platform: "ios" | "android" | "web" | "all") => {
    if (!sourceFile) {
      toast({
        title: "请先选择图片",
        description: "请上传要生成图标的原始图片",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    try {
      let sizes: number[] = []

      if (platform === "ios") {
        sizes = iosIconSizes.map((s) => s.size)
      } else if (platform === "android") {
        sizes = androidIconSizes.map((s) => s.size)
      } else if (platform === "web") {
        sizes = webIconSizes.map((s) => s.size)
      } else {
        sizes = [...iosIconSizes, ...androidIconSizes, ...webIconSizes].map((s) => s.size)
      }

      const uniqueSizes = Array.from(new Set(sizes))
      const icons = await generateAppIcons(sourceFile, uniqueSizes)
      setGeneratedIcons(icons)

      toast({
        title: "生成成功",
        description: `已生成 ${icons.size} 个不同尺寸的图标`,
      })
    } catch (error) {
      console.error("生成图标失败:", error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "图标生成过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadAll = async (platform: "ios" | "android" | "web") => {
    if (generatedIcons.size === 0) return

    const zip = new JSZip()
    const folder = zip.folder(platform)

    const iconList = platform === "ios" ? iosIconSizes : platform === "android" ? androidIconSizes : webIconSizes

    for (const iconSize of iconList) {
      const blob = generatedIcons.get(iconSize.size)
      if (blob && folder) {
        folder.file(`icon_${iconSize.size}x${iconSize.size}.png`, blob)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const link = document.createElement("a")
    link.href = url
    link.download = `${platform}_icons.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "下载成功",
      description: `${platform.toUpperCase()} 图标包已下载`,
    })
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
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
              应用图标生成器
            </h1>
            <p className="text-gray-600">一键生成 iOS、Android、Web 所需的全套应用图标</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 上传区域 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传原始图标
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
                >
                  {sourcePreview ? (
                    <div className="space-y-4">
                      <img
                        src={sourcePreview || "/placeholder.svg"}
                        alt="原图"
                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                      />
                      <Button variant="outline" size="sm">
                        重新选择
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">点击上传图标</p>
                        <p className="text-sm text-gray-500 mt-1">建议使用 1024x1024 的 PNG 图片</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("ios")}
                    disabled={!sourceFile || generating}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 mr-2" />
                    )}
                    生成 iOS 图标
                  </Button>

                  <Button
                    onClick={() => handleGenerate("android")}
                    disabled={!sourceFile || generating}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 mr-2" />
                    )}
                    生成 Android 图标
                  </Button>

                  <Button
                    onClick={() => handleGenerate("web")}
                    disabled={!sourceFile || generating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 mr-2" />
                    )}
                    生成 Web 图标
                  </Button>

                  <Button
                    onClick={() => handleGenerate("all")}
                    disabled={!sourceFile || generating}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4 mr-2" />
                    )}
                    生成全部平台图标
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-medium mb-2">使用提示:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 建议使用 1024x1024 像素的正方形图片</li>
                    <li>• PNG 格式支持透明背景</li>
                    <li>• 图标设计应简洁清晰,避免细节过多</li>
                    <li>• 生成后可批量下载 ZIP 压缩包</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 生成结果 */}
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    生成的图标
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {generatedIcons.size > 0 ? (
                    <div className="space-y-6">
                      {/* 双栏对比布局 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-gray-700 mb-2">原始图片</p>
                          <img
                            src={sourcePreview}
                            alt="原始图片"
                            className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-gray-700 mb-2">预览 (1024x1024 像素)</p>
                          {(() => {
                            const largestSize = Math.max(...Array.from(generatedIcons.keys()))
                            const blob = generatedIcons.get(largestSize)
                            if (!blob) return null
                            const url = URL.createObjectURL(blob)
                            return (
                              <img
                                src={url}
                                alt="预览图标"
                                className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                              />
                            )
                          })()}
                        </div>
                      </div>
                      
                      {/* 平台选择 */}
                      <Tabs defaultValue="ios">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="ios">iOS 图标 ({iosIconSizes.length})</TabsTrigger>
                          <TabsTrigger value="android">Android 图标 ({androidIconSizes.length})</TabsTrigger>
                          <TabsTrigger value="web">Web 图标 ({webIconSizes.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ios" className="space-y-4 mt-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">iOS 应用图标 ({iosIconSizes.length} 个尺寸)</p>
                            <Button onClick={() => handleDownloadAll("ios")} size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              下载全部
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                            {iosIconSizes.map((iconSize) => {
                              const blob = generatedIcons.get(iconSize.size)
                              if (!blob) return null
                              const url = URL.createObjectURL(blob)
                              return (
                                <div key={iconSize.size} className="text-center">
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`${iconSize.size}x${iconSize.size}`}
                                    className="w-full rounded-lg shadow-md mb-2"
                                  />
                                  <p className="text-xs text-gray-600">{iconSize.size}px</p>
                                  <p className="text-xs text-gray-400">{iconSize.usage}</p>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="android" className="space-y-4 mt-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Android 应用图标 ({androidIconSizes.length} 个尺寸)</p>
                            <Button onClick={() => handleDownloadAll("android")} size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              下载全部
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                            {androidIconSizes.map((iconSize) => {
                              const blob = generatedIcons.get(iconSize.size)
                              if (!blob) return null
                              const url = URL.createObjectURL(blob)
                              return (
                                <div key={iconSize.size} className="text-center">
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`${iconSize.size}x${iconSize.size}`}
                                    className="w-full rounded-lg shadow-md mb-2"
                                  />
                                  <p className="text-xs text-gray-600">{iconSize.size}px</p>
                                  <p className="text-xs text-gray-400">{iconSize.usage}</p>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="web" className="space-y-4 mt-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Web 应用图标 ({webIconSizes.length} 个尺寸)</p>
                            <Button onClick={() => handleDownloadAll("web")} size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              下载全部
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                            {webIconSizes.map((iconSize) => {
                              const blob = generatedIcons.get(iconSize.size)
                              if (!blob) return null
                              const url = URL.createObjectURL(blob)
                              return (
                                <div key={iconSize.size} className="text-center">
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`${iconSize.size}x${iconSize.size}`}
                                    className="w-full rounded-lg shadow-md mb-2"
                                  />
                                  <p className="text-xs text-gray-600">{iconSize.size}px</p>
                                  <p className="text-xs text-gray-400">{iconSize.usage}</p>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <Smartphone className="w-16 h-16 mb-4" />
                      <p>生成的图标将显示在这里</p>
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
