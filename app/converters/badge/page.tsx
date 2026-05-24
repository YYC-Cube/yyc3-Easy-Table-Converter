"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Award, Download, ArrowLeft, Copy } from "lucide-react"
import Link from "next/link"
import { generateBadgeSVG, badgePresets, type BadgeConfig } from "@/lib/utils/badgeGenerator"

export default function BadgeGeneratorPage() {
  const [config, setConfig] = useState<BadgeConfig>({
    label: "build",
    message: "passing",
    labelColor: "#555",
    messageColor: "#4c1",
    style: "flat",
  })
  const [svgCode, setSvgCode] = useState("")
  const { toast } = useToast()

  const handleGenerate = () => {
    const svg = generateBadgeSVG(config)
    setSvgCode(svg)
  }

  const handleDownload = () => {
    if (!svgCode) return

    const blob = new Blob([svgCode], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `badge_${config.label}_${config.message}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "下载成功",
      description: "徽章 SVG 文件已下载",
    })
  }

  const handleCopyCode = () => {
    if (!svgCode) return
    navigator.clipboard.writeText(svgCode)
    toast({
      title: "已复制",
      description: "SVG 代码已复制到剪贴板",
    })
  }

  const handleApplyPreset = (preset: (typeof badgePresets)[0]) => {
    setConfig({
      ...config,
      label: preset.label,
      message: preset.message,
      labelColor: preset.labelColor,
      messageColor: preset.messageColor,
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
        <div className="max-w-5xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl mb-4 shadow-2xl">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-yellow-800 to-orange-800 bg-clip-text text-transparent mb-2">
              徽章生成器
            </h1>
            <p className="text-gray-600">生成 GitHub 风格的徽章,支持自定义文字、颜色</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 配置面板 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  徽章配置
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>标签文字</Label>
                  <Input
                    value={config.label}
                    onChange={(e) => setConfig({ ...config, label: e.target.value })}
                    placeholder="build"
                  />
                </div>

                <div className="space-y-2">
                  <Label>消息文字</Label>
                  <Input
                    value={config.message}
                    onChange={(e) => setConfig({ ...config, message: e.target.value })}
                    placeholder="passing"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>标签颜色</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.labelColor}
                        onChange={(e) => setConfig({ ...config, labelColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.labelColor}
                        onChange={(e) => setConfig({ ...config, labelColor: e.target.value })}
                        placeholder="#555"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>消息颜色</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.messageColor}
                        onChange={(e) => setConfig({ ...config, messageColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.messageColor}
                        onChange={(e) => setConfig({ ...config, messageColor: e.target.value })}
                        placeholder="#4c1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>徽章样式</Label>
                  <Select value={config.style} onValueChange={(value: any) => setConfig({ ...config, style: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">扁平</SelectItem>
                      <SelectItem value="flat-square">扁平方形</SelectItem>
                      <SelectItem value="plastic">塑料</SelectItem>
                      <SelectItem value="for-the-badge">大徽章</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600"
                  size="lg"
                >
                  <Award className="w-4 h-4 mr-2" />
                  生成徽章
                </Button>

                <div className="space-y-2">
                  <Label>预设模板</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {badgePresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset(preset)}
                        className="justify-start"
                      >
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: preset.messageColor }} />
                        {preset.label}: {preset.message}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 预览和下载 */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  徽章预览
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {svgCode ? (
                  <>
                    <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-32">
                      <div dangerouslySetInnerHTML={{ __html: svgCode }} />
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleDownload}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        size="lg"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下载 SVG
                      </Button>

                      <Button onClick={handleCopyCode} variant="outline" className="w-full bg-transparent" size="lg">
                        <Copy className="w-4 h-4 mr-2" />
                        复制 SVG 代码
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>SVG 代码</Label>
                      <textarea
                        value={svgCode}
                        readOnly
                        className="w-full h-48 p-3 text-xs font-mono bg-gray-50 border rounded-lg resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Award className="w-16 h-16 mb-4" />
                    <p>点击生成徽章按钮查看预览</p>
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
