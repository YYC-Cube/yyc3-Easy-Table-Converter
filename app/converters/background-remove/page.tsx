"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, Scissors, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"

export default function BackgroundRemovePage() {
  // 文件状态管理待实现
  const [sourcePreview, setSourcePreview] = useState("")
  const [processedPreview] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setSourcePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  // 背景移除功能待实现

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
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
              一键抠图
            </h1>
            <p className="text-slate-600">AI 智能去除图片背景</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                功能说明
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-blue-50 rounded-lg p-6 text-slate-700">
                <p className="font-medium mb-3">抠图功能需要 AI 模型支持</p>
                <p className="text-sm mb-4">
                  由于浏览器端的限制,完整的 AI 抠图功能需要后端服务支持。推荐使用以下专业服务:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      <strong>remove.bg</strong> - 专业的背景移除服务,支持人像和产品图
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      <strong>Photoshop</strong> - Adobe 的专业图像处理软件
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      <strong>Canva</strong> - 在线设计工具,提供背景移除功能
                    </span>
                  </li>
                </ul>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
              >
                {sourcePreview ? (
                  <img
                    src={sourcePreview || "/placeholder.svg"}
                    alt="预览"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">点击上传图片</p>
                  </div>
                )}
              </div>
              
              {processedPreview && (
                <Card className="mt-6 bg-white/90 backdrop-blur-sm shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      处理结果对比
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* 双栏对比布局 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                          <p className="text-sm font-medium text-gray-700 mb-2 text-center">原图</p>
                          <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                            <img
                              src={sourcePreview}
                              alt="原始图片"
                              className="max-w-full max-h-[300px] mx-auto rounded-md"
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 w-full">
                          <p className="text-sm font-medium text-gray-700 mb-2 text-center">移除背景后</p>
                          <div className="min-h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
                            <img
                              src={processedPreview}
                              alt="处理后的图片"
                              className="max-w-full max-h-[300px] mx-auto rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                       
                      {/* 提示信息 */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-blue-700">
                          💡 由于浏览器端限制，完整的AI抠图功能需要后端服务支持
                        </p>
                      </div>
                       
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300"
                      >
                        下载处理后图片
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
