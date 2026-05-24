"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, Copy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function TimestampConverter() {
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [timestamp, setTimestamp] = useState<string>("")
  const [dateTime, setDateTime] = useState<string>("")
  const [timezone, setTimezone] = useState<string>("Asia/Shanghai")
  
  // 使用useToast hook
  const toastContext = useToast()
  const { toast: _toast } = toastContext
  
  // 使用useRef来安全地存储完整的toast上下文
  const toastRef = useRef(toastContext)
  
  useEffect(() => {
    toastRef.current = toastContext
    // 只在客户端设置当前时间
    setCurrentTime(Date.now())
  }, [toastContext])

  useEffect(() => {
    // 确保在客户端环境中设置定时器
    let timer: NodeJS.Timeout | null = null
    if (typeof window !== 'undefined') {
      timer = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
    }
    
    // 返回清理函数
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [])

  const formatDateTime = (ts: number, tz: string): string => {
    try {
      return new Date(ts).toLocaleString("zh-CN", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    } catch (error) {
      return "无效时区"
    }
  }

  const timestampToDate = () => {
    const ts = Number(timestamp)
    if (isNaN(ts)) {
      // 使用ref.current来避免直接依赖
      toastRef.current?.toast({
        title: "错误",
        description: "请输入有效的时间戳",
        variant: "destructive",
      })
      return
    }
    const date = new Date(ts.toString().length === 10 ? ts * 1000 : ts)
    setDateTime(formatDateTime(date.getTime(), timezone))
  }

  const dateToTimestamp = () => {
    try {
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        toastRef.current?.toast({
          title: "错误",
          description: "请输入有效的日期时间格式",
          variant: "destructive",
        })
        return
      }
      setTimestamp(Math.floor(date.getTime() / 1000).toString())
    } catch (error) {
      toastRef.current?.toast({
        title: "错误",
        description: "日期时间格式不正确",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      // 确保在客户端环境中访问navigator
      if (typeof navigator !== 'undefined') {
        await navigator.clipboard.writeText(text)
        toastRef.current?.toast({
          title: "复制成功",
          description: "已复制到剪贴板",
        })
      }
    } catch (error) {
      toastRef.current?.toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      })
    }
  }

  const timezones = [
    { value: "Asia/Shanghai", label: "中国标准时间 (CST)" },
    { value: "UTC", label: "协调世界时 (UTC)" },
    { value: "America/New_York", label: "美国东部时间 (EST)" },
    { value: "America/Los_Angeles", label: "美国太平洋时间 (PST)" },
    { value: "Europe/London", label: "英国时间 (GMT)" },
    { value: "Asia/Tokyo", label: "日本标准时间 (JST)" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <div className="space-y-6">
          <Card className="card-data bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                当前时间
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">当前时间戳（秒）</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 md:h-14 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg flex items-center overflow-hidden">
                      <span className="text-base md:text-lg font-mono font-semibold text-blue-900 truncate">
                        {Math.floor(currentTime / 1000)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(Math.floor(currentTime / 1000).toString())}
                      className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">当前时间戳（毫秒）</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 md:h-14 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg flex items-center overflow-hidden">
                      <span className="text-base md:text-lg font-mono font-semibold text-blue-900 truncate">
                        {currentTime}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(currentTime.toString())}
                      className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm text-slate-600">当前日期时间</Label>
                <div className="h-12 md:h-14 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg flex items-center mt-2">
                  <span className="text-base md:text-lg font-semibold text-blue-900 truncate">
                    {formatDateTime(currentTime, timezone)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-data bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 border-b p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">时间戳转换</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">时区选择</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full h-12 md:h-14 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value} className="text-base py-3">
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">时间戳 → 日期时间</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    placeholder="输入时间戳（秒或毫秒）"
                    className="h-12 md:h-14 text-base flex-1"
                  />
                  <Button
                    onClick={timestampToDate}
                    className="h-12 md:h-14 px-6 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    转换
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">日期时间 → 时间戳</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    placeholder="输入日期时间（如：2024-01-01 12:00:00）"
                    className="h-12 md:h-14 text-base flex-1"
                  />
                  <Button
                    onClick={dateToTimestamp}
                    className="h-12 md:h-14 px-6 w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    转换
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-lg">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>提示：</strong>支持秒级和毫秒级时间戳转换，支持多种时区，日期格式示例：2024-01-01 12:00:00
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
