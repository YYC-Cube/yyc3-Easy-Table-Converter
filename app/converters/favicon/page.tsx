"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Globe, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import JSZip from "jszip"

const faviconSizes = [16, 32, 48, 64, 128, 256]

export default function FaviconPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState("")
  const [processing, setProcessing] = useState(false)
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
  }

  const generateFavicon = async (size: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, size, size)
        canvas.toBlob((blob) => resolve(blob!), "image/png")
      }
      img.src = sourcePreview
    })
  }

  const handleGenerate = async () => {
    if (!sourceFile) {
      toast({ title: "请先选择图片", variant: "destructive" })
      return
    }

    setProcessing(true)
    try {
      const zip = new JSZip()

      for (const size of faviconSizes) {
        const blob = await generateFavicon(size)
        zip.file(`favicon-${size}x${size}.png`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = "favicons.zip"
      link.click()
      URL.revokeObjectURL(url)

      toast({ title: "生成成功", description: "所有尺寸的 Favicon 已打包下载" })
    } catch (error) {
      toast({ title: "生成失败", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-2xl">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-800 bg-clip-text text-transparent mb-2">
              网站图标生成
            </h1>
            <p className="text-slate-600">一键生成所有尺寸的 Favicon</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-image">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Favicon 生成器
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
              >
                {sourcePreview ? (
                  <img
                    src={sourcePreview || "/placeholder.svg"}
                    alt="预览"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">点击上传图片</p>
                    <p className="text-sm text-slate-500">建议使用正方形图片,最小 256×256</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-slate-800 mb-2">将生成以下尺寸:</p>
                <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                  {faviconSizes.map((size) => (
                    <div key={size} className="bg-white rounded px-3 py-2 text-center">
                      {size}×{size}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!sourceFile || processing}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    生成并下载
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
