"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Palette, ArrowLeft, Copy } from "lucide-react"
import Link from "next/link"

export default function ColorConverterPage() {
  const [hex, setHex] = useState("#3b82f6")
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 })
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 })
  const { toast } = useToast()

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  const handleHexChange = (value: string) => {
    setHex(value)
    const rgbValue = hexToRgb(value)
    if (rgbValue) {
      setRgb(rgbValue)
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b))
    }
  }

  const handleRgbChange = (r: number, g: number, b: number) => {
    setRgb({ r, g, b })
    setHex(rgbToHex(r, g, b))
    setHsl(rgbToHsl(r, g, b))
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "复制成功", description: `${label} 已复制到剪贴板` })
    } catch (error) {
      toast({ title: "复制失败", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-rose-800 to-pink-800 bg-clip-text text-transparent mb-2">
              颜色格式转换
            </h1>
            <p className="text-slate-600">HEX、RGB、HSL 颜色格式互转</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-color">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                颜色转换器
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="w-full h-32 rounded-xl shadow-lg" style={{ backgroundColor: hex }}></div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>HEX 颜色</Label>
                  <div className="flex gap-2">
                    <Input
                      value={hex}
                      onChange={(e) => handleHexChange(e.target.value)}
                      placeholder="#000000"
                      className="font-mono"
                    />
                    <Button onClick={() => handleCopy(hex, "HEX")} variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>RGB 颜色</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      value={rgb.r}
                      onChange={(e) => handleRgbChange(Number(e.target.value), rgb.g, rgb.b)}
                      min="0"
                      max="255"
                      placeholder="R"
                    />
                    <Input
                      type="number"
                      value={rgb.g}
                      onChange={(e) => handleRgbChange(rgb.r, Number(e.target.value), rgb.b)}
                      min="0"
                      max="255"
                      placeholder="G"
                    />
                    <Input
                      type="number"
                      value={rgb.b}
                      onChange={(e) => handleRgbChange(rgb.r, rgb.g, Number(e.target.value))}
                      min="0"
                      max="255"
                      placeholder="B"
                    />
                  </div>
                  <Button
                    onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "RGB")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制 RGB
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>HSL 颜色</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input value={hsl.h} readOnly placeholder="H" />
                      <p className="text-xs text-slate-500 mt-1">色相</p>
                    </div>
                    <div>
                      <Input value={`${hsl.s}%`} readOnly placeholder="S" />
                      <p className="text-xs text-slate-500 mt-1">饱和度</p>
                    </div>
                    <div>
                      <Input value={`${hsl.l}%`} readOnly placeholder="L" />
                      <p className="text-xs text-slate-500 mt-1">亮度</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "HSL")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制 HSL
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
