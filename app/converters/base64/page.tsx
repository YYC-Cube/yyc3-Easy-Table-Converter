"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Upload, Copy, Download, FileCode, ArrowLeft } from "lucide-react"
import Link from "next/link"
// base64Utils 函数暂未使用

export default function Base64Converter() {
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [textInput, setTextInput] = useState("")
  const [base64Output, setBase64Output] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleTextEncode = () => {
    if (!textInput.trim()) {
      toast({
        title: "请输入文本",
        description: "请在输入框中输入要编码的文本",
        variant: "destructive",
      })
      return
    }

    try {
      const encoded = btoa(unescape(encodeURIComponent(textInput)))
      setBase64Output(encoded)
      toast({
        title: "编码成功",
        description: "文本已转换为 Base64 格式",
      })
    } catch (error) {
      toast({
        title: "编码失败",
        description: "文本编码过程中出现错误",
        variant: "destructive",
      })
    }
  }

  const handleTextDecode = () => {
    if (!textInput.trim()) {
      toast({
        title: "请输入 Base64",
        description: "请在输入框中输入要解码的 Base64 字符串",
        variant: "destructive",
      })
      return
    }

    try {
      const decoded = decodeURIComponent(escape(atob(textInput)))
      setBase64Output(decoded)
      toast({
        title: "解码成功",
        description: "Base64 已转换为文本",
      })
    } catch (error) {
      toast({
        title: "解码失败",
        description: "Base64 格式不正确或解码过程中出现错误",
        variant: "destructive",
      })
    }
  }

  const handleImageEncode = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setBase64Output(result)
      setImagePreview(result)
      toast({
        title: "编码成功",
        description: "图片已转换为 Base64 格式",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleImageDecode = () => {
    if (!textInput.trim()) {
      toast({
        title: "请输入 Base64",
        description: "请输入图片的 Base64 字符串",
        variant: "destructive",
      })
      return
    }

    try {
      // 验证是否为有效的图片 Base64
      if (!textInput.startsWith("data:image/")) {
        throw new Error("不是有效的图片 Base64 格式")
      }
      setImagePreview(textInput)
      toast({
        title: "解码成功",
        description: "Base64 已转换为图片",
      })
    } catch (error) {
      toast({
        title: "解码失败",
        description: "Base64 格式不正确",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    if (!base64Output) return

    try {
      await navigator.clipboard.writeText(base64Output)
      toast({
        title: "复制成功",
        description: "Base64 内容已复制到剪贴板",
      })
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      })
    }
  }

  const handleDownloadImage = () => {
    if (!imagePreview) return

    const link = document.createElement("a")
    link.href = imagePreview
    link.download = "decoded-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "下载成功",
      description: "图片已保存到本地",
    })
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
        <div className="max-w-5xl mx-auto">
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
              <FileCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Base64 编解码
            </h1>
            <p className="text-gray-600">文本、图片与 Base64 格式互转</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="text">文本编解码</TabsTrigger>
                  <TabsTrigger value="image">图片编解码</TabsTrigger>
                </TabsList>

                {/* 文本编解码 */}
                <TabsContent value="text" className="space-y-6">
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant={mode === "encode" ? "default" : "outline"}
                      onClick={() => setMode("encode")}
                      className="flex-1"
                    >
                      编码 (文本 → Base64)
                    </Button>
                    <Button
                      variant={mode === "decode" ? "default" : "outline"}
                      onClick={() => setMode("decode")}
                      className="flex-1"
                    >
                      解码 (Base64 → 文本)
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {mode === "encode" ? "输入文本" : "输入 Base64"}
                      </label>
                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={mode === "encode" ? "请输入要编码的文本..." : "请输入要解码的 Base64 字符串..."}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button
                      onClick={mode === "encode" ? handleTextEncode : handleTextDecode}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {mode === "encode" ? "编码" : "解码"}
                    </Button>

                    {base64Output && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium">
                            {mode === "encode" ? "Base64 输出" : "文本输出"}
                          </label>
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="w-4 h-4 mr-2" />
                            复制
                          </Button>
                        </div>
                        <Textarea value={base64Output} readOnly rows={6} className="font-mono text-sm bg-gray-50" />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 图片编解码 */}
                <TabsContent value="image" className="space-y-6">
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant={mode === "encode" ? "default" : "outline"}
                      onClick={() => setMode("encode")}
                      className="flex-1"
                    >
                      编码 (图片 → Base64)
                    </Button>
                    <Button
                      variant={mode === "decode" ? "default" : "outline"}
                      onClick={() => setMode("decode")}
                      className="flex-1"
                    >
                      解码 (Base64 → 图片)
                    </Button>
                  </div>

                  {mode === "encode" ? (
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageEncode}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-700">点击上传图片</p>
                        <p className="text-sm text-gray-500 mt-1">支持 PNG、JPG、GIF 等格式</p>
                      </div>

                      {imagePreview && (
                        <div className="space-y-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="预览"
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCopy} className="flex-1 bg-transparent">
                              <Copy className="w-4 h-4 mr-2" />
                              复制 Base64
                            </Button>
                          </div>
                        </div>
                      )}

                      {base64Output && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Base64 输出</label>
                          <Textarea value={base64Output} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">输入图片 Base64</label>
                        <Textarea
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="请输入图片的 Base64 字符串 (以 data:image/ 开头)..."
                          rows={6}
                          className="font-mono text-xs"
                        />
                      </div>

                      <Button
                        onClick={handleImageDecode}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        解码为图片
                      </Button>

                      {imagePreview && (
                        <div className="space-y-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="解码结果"
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                          />
                          <Button variant="outline" onClick={handleDownloadImage} className="w-full bg-transparent">
                            <Download className="w-4 h-4 mr-2" />
                            下载图片
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
