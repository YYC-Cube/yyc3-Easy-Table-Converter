"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Code, Copy, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function JsonXmlConverter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"json-to-xml" | "xml-to-json">("json-to-xml")
  const { toast } = useToast()

  const jsonToXml = (json: string): string => {
    try {
      const obj = JSON.parse(json)

      const convertToXml = (obj: any, rootName = "root"): string => {
        if (typeof obj !== "object" || obj === null) {
          return `<${rootName}>${obj}</${rootName}>`
        }

        if (Array.isArray(obj)) {
          return obj.map((item) => convertToXml(item, `item`)).join("\n")
        }

        let xml = `<${rootName}>\n`
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "object" && value !== null) {
            xml += `  ${convertToXml(value, key)}\n`
          } else {
            xml += `  <${key}>${value}</${key}>\n`
          }
        }
        xml += `</${rootName}>`
        return xml
      }

      return `<?xml version="1.0" encoding="UTF-8"?>\n${convertToXml(obj)}`
    } catch (error) {
      throw new Error("无效的 JSON 格式")
    }
  }

  const xmlToJson = (xml: string): string => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xml, "text/xml")

      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("无效的 XML 格式")
      }

      const convertToJson = (node: Element): any => {
        if (node.children.length === 0) {
          return node.textContent
        }

        const obj: any = {}
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          const key = child.tagName
          const value = convertToJson(child)

          if (obj[key]) {
            if (Array.isArray(obj[key])) {
              obj[key].push(value)
            } else {
              obj[key] = [obj[key], value]
            }
          } else {
            obj[key] = value
          }
        }
        return obj
      }

      const result = convertToJson(xmlDoc.documentElement)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      throw new Error("无效的 XML 格式")
    }
  }

  const handleConvert = () => {
    if (!input.trim()) {
      toast({
        title: "错误",
        description: "请输入要转换的内容",
        variant: "destructive",
      })
      return
    }

    try {
      const result = mode === "json-to-xml" ? jsonToXml(input) : xmlToJson(input)
      setOutput(result)
      toast({
        title: "转换成功",
        description: `已成功转换为 ${mode === "json-to-xml" ? "XML" : "JSON"} 格式`,
      })
    } catch (error) {
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "转换过程中发生错误",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      toast({
        title: "复制成功",
        description: "结果已复制到剪贴板",
      })
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (!output) return
    const extension = mode === "json-to-xml" ? "xml" : "json"
    const blob = new Blob([output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `converted.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: "下载成功",
      description: `文件已保存为 converted.${extension}`,
    })
  }

  const switchMode = () => {
    setMode(mode === "json-to-xml" ? "xml-to-json" : "json-to-xml")
    setInput(output)
    setOutput("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="card-data bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Code className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              JSON/XML 互转
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <span className="text-lg font-semibold text-slate-700">
                {mode === "json-to-xml" ? "JSON → XML" : "XML → JSON"}
              </span>
              <Button onClick={switchMode} variant="outline" className="gap-2 h-11 w-full sm:w-auto bg-transparent">
                <RefreshCw className="w-4 h-4" />
                切换方向
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">输入 ({mode === "json-to-xml" ? "JSON" : "XML"})</Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "json-to-xml"
                      ? '{"name": "张三", "age": 25}'
                      : "<root><name>张三</name><age>25</age></root>"
                  }
                  className="min-h-[250px] md:min-h-[400px] font-mono text-sm"
                />
                <Button
                  onClick={handleConvert}
                  className="w-full h-12 md:h-14 text-base bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  转换
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span>输出 ({mode === "json-to-xml" ? "XML" : "JSON"})</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      disabled={!output}
                      className="flex-1 sm:flex-none h-10 bg-transparent"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      disabled={!output}
                      className="flex-1 sm:flex-none h-10 bg-transparent"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </Label>
                <Textarea
                  value={output}
                  readOnly
                  placeholder="转换结果将显示在这里"
                  className="min-h-[250px] md:min-h-[400px] font-mono text-sm bg-slate-50"
                />
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-lg">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>提示：</strong>支持 JSON 与 XML 数据格式互转，自动格式化输出，支持嵌套对象和数组
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
