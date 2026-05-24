"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Droplet, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { addWatermark } from "@/lib/utils/imageProcessor"

export default function WatermarkPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [watermarkedPreview, setWatermarkedPreview] = useState<string>("")
  const [watermarkText, setWatermarkText] = useState("© 2025")
  const [position, setPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center">(
    "bottom-right",
  )
  const [opacity, setOpacity] = useState(0.5)
  const [fontSize, setFontSize] = useState(24)
  const [processing, setProcessing] = useState(false)
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null)
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
    setWatermarkedPreview("")
    setWatermarkedBlob(null)
  }

  const handleAddWatermark = async () => {
    if (!sourceFile) {
      toast({
        title: "请先选择图片",
        description: "请上传要添加水印的图片文件",
        variant: "destructive",
      })
      return
    }

    if (!watermarkText.trim()) {
      toast({
        title: "请输入水印文字",
        description: "水印文字不能为空",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      const blob = await addWatermark(sourceFile, watermarkText, position, opacity, fontSize)
      setWatermarkedBlob(blob)
      const url = URL.createObjectURL(blob)
      setWatermarkedPreview(url)

      toast({
        title: "添加成功",
        description: "水印已成功添加到图片",
      })
    } catch (error) {
      console.error("添加水印失败:", error)
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加水印过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!watermarkedBlob || !sourceFile) return

    const url = URL.createObjectURL(watermarkedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `watermarked_${sourceFile.name}`
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl mb-4 shadow-2xl">
              <Droplet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-cyan-800 to-blue-800 bg-clip-text text-transparent mb-2">
              水印添加
            </h1>
            <p className="text-gray-600">为图片添加文字水印，保护版权</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/50 transition-all"
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
                      <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">点击上传图片</p>
                        <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG 等格式</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>水印文字</Label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="输入水印文字"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>水印位置</Label>
                    <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">左上角</SelectItem>
                        <SelectItem value="top-right">右上角</SelectItem>
                        <SelectItem value="bottom-left">左下角</SelectItem>
                        <SelectItem value="bottom-right">右下角</SelectItem>
                        <SelectItem value="center">居中</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>透明度</Label>
                      <span className="text-sm text-gray-600">{(opacity * 100).toFixed(0)}%</span>
                    </div>
                    <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} min={0.1} max={1} step={0.05} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>字体大小</Label>
                      <span className="text-sm text-gray-600">{fontSize}px</span>
                    </div>
                    <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={12} max={72} step={2} />
                  </div>
                </div>

                <Button
                  onClick={handleAddWatermark}
                  disabled={!sourceFile || processing}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Droplet className="w-4 h-4 mr-2" />
                      添加水印
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5" />
                  处理结果对比
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {watermarkedPreview ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500">原图</p>
                        <div className="bg-gray-50 rounded-xl p-4 shadow-sm min-h-[200px] flex items-center justify-center">
                          <img
                            src={sourcePreview || "/placeholder.svg"}
                            alt="原图"
                            className="max-w-full max-h-[300px] mx-auto rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500">添加水印后</p>
                        <div className="bg-gray-50 rounded-xl p-4 shadow-sm min-h-[200px] flex items-center justify-center">
                          <img
                            src={watermarkedPreview || "/placeholder.svg"}
                            alt="添加水印后"
                            className="max-w-full max-h-[300px] mx-auto rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">提示: 水印添加位置和透明度可以通过左侧面板调整，确保版权保护的同时不会过度影响图片美观。</p>
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载图片
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Droplet className="w-16 h-16 mb-4" />
                    <p>添加水印后的图片将显示在这里</p>
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
