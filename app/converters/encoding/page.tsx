"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, ArrowLeft, Copy } from "lucide-react"
import Link from "next/link"

export default function EncodingConverterPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [sourceEncoding, setSourceEncoding] = useState("utf8")
  const [targetEncoding, setTargetEncoding] = useState("base64")
  const { toast } = useToast()

  const encodings = [
    { value: "utf8", label: "UTF-8" },
    { value: "base64", label: "Base64" },
    { value: "hex", label: "HEX" },
    { value: "url", label: "URL 编码" },
  ]

  const handleConvert = () => {
    if (!input.trim()) {
      toast({ title: "请输入文本", variant: "destructive" })
      return
    }

    try {
      let result = input

      if (sourceEncoding === "base64") {
        result = atob(result)
      } else if (sourceEncoding === "hex") {
        result =
          result
            .match(/.{1,2}/g)
            ?.map((byte) => String.fromCharCode(Number.parseInt(byte, 16)))
            .join("") || ""
      } else if (sourceEncoding === "url") {
        result = decodeURIComponent(result)
      }

      if (targetEncoding === "base64") {
        result = btoa(unescape(encodeURIComponent(result)))
      } else if (targetEncoding === "hex") {
        result = Array.from(result)
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      } else if (targetEncoding === "url") {
        result = encodeURIComponent(result)
      }

      setOutput(result)
      toast({ title: "转换成功" })
    } catch (error) {
      toast({ title: "转换失败", description: "请检查输入格式", variant: "destructive" })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast({ title: "复制成功" })
    } catch (error) {
      toast({ title: "复制失败", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl mb-4 shadow-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-teal-800 to-cyan-800 bg-clip-text text-transparent mb-2">
              文本编码转换
            </h1>
            <p className="text-slate-600">UTF-8、Base64、HEX、URL 编码互转</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-text">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  输入
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">源编码</label>
                  <Select value={sourceEncoding} onValueChange={setSourceEncoding}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {encodings.map((enc) => (
                        <SelectItem key={enc.value} value={enc.value}>
                          {enc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入文本..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <Button onClick={handleConvert} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600" size="lg">
                  转换
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl card-text">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  输出
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">目标编码</label>
                  <Select value={targetEncoding} onValueChange={setTargetEncoding}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {encodings.map((enc) => (
                        <SelectItem key={enc.value} value={enc.value}>
                          {enc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea value={output} readOnly rows={12} className="font-mono text-sm bg-slate-50" />
                <Button onClick={handleCopy} variant="outline" className="w-full bg-transparent" disabled={!output}>
                  <Copy className="w-4 h-4 mr-2" />
                  复制结果
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
