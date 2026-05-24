"use client"

import React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Code2, ArrowLeft, Copy } from "lucide-react"
import Link from "next/link"

export default function SvgOptimizePage() {
  const [svgInput, setSvgInput] = useState("")
  const [svgOutput, setSvgOutput] = useState("")
  const [originalSize, setOriginalSize] = useState(0)
  const [optimizedSize, setOptimizedSize] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastRef = React.useRef<any>(null)

  React.useEffect(() => {
    // 确保在客户端环境中初始化toast
    const { toast } = useToast()
    toastRef.current = toast
  }, [])

  const safeToast = (options: any) => {
    if (typeof window !== 'undefined' && toastRef.current) {
      toastRef.current(options)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setSvgInput(content)
      setOriginalSize(new Blob([content]).size)
    }
    reader.readAsText(file)
  }

  const optimizeSvg = (svg: string): string => {
    let optimized = svg
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, "")
    optimized = optimized.replace(/\s+/g, " ")
    optimized = optimized.replace(/>\s+</g, "><")
    optimized = optimized.replace(/\s*([{}:;,])\s*/g, "$1")
    optimized = optimized.trim()
    return optimized
  }

  const handleOptimize = () => {
    if (!svgInput.trim()) {
      safeToast({ title: "请输入 SVG 代码", variant: "destructive" })
      return
    }

    try {
      const optimized = optimizeSvg(svgInput)
      setSvgOutput(optimized)
      setOptimizedSize(new Blob([optimized]).size)
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)
      safeToast({ title: "优化成功", description: `文件大小减少了 ${reduction}%` })
    } catch (error) {
      safeToast({ title: "优化失败", variant: "destructive" })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svgOutput)
      safeToast({ title: "复制成功" })
    } catch (error) {
      safeToast({ title: "复制失败", variant: "destructive" })
    }
  }

  const handleDownload = () => {
    const blob = new Blob([svgOutput], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "optimized.svg"
    link.click()
    URL.revokeObjectURL(url)
    safeToast({ title: "下载成功" })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
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
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
              SVG 优化
            </h1>
            <p className="text-slate-600">压缩和优化 SVG 文件,减小文件大小</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  输入 SVG
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <input ref={fileInputRef} type="file" accept=".svg" onChange={handleFileSelect} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  上传 SVG 文件
                </Button>
                <Textarea
                  value={svgInput}
                  onChange={(e) => setSvgInput(e.target.value)}
                  placeholder="或粘贴 SVG 代码..."
                  rows={15}
                  className="font-mono text-sm"
                />
                {originalSize > 0 && <p className="text-sm text-slate-600">原始大小: {formatSize(originalSize)}</p>}
                <Button
                  onClick={handleOptimize}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  size="lg"
                >
                  优化 SVG
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  优化结果
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Textarea value={svgOutput} readOnly rows={15} className="font-mono text-sm bg-slate-50" />
                {optimizedSize > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-slate-700">优化后大小: {formatSize(optimizedSize)}</p>
                    <p className="text-sm text-green-700 font-medium">
                      减少: {formatSize(originalSize - optimizedSize)} (
                      {((1 - optimizedSize / originalSize) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 bg-transparent"
                    disabled={!svgOutput}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1 bg-transparent"
                    disabled={!svgOutput}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
