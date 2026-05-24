// 历史记录面板组件
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, RotateCcw } from "lucide-react"
import type { HistoryItem } from "@/YYC_原油/lib/utils/historyManager"

interface HistoryPanelProps {
  history: HistoryItem[]
  onRestore?: (item: HistoryItem) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function HistoryPanel({ history, onRestore, onRemove, onClear }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无历史记录</p>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "刚刚"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString("zh-CN")
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            历史记录
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.type}
                    </Badge>
                    <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
                  </div>
                  {item.input.fileName && (
                    <p className="text-sm font-medium text-gray-900 truncate">{item.input.fileName}</p>
                  )}
                  {item.input.format && item.output.format && (
                    <p className="text-xs text-gray-600">
                      {item.input.format} → {item.output.format}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {onRestore && (
                    <Button variant="ghost" size="sm" onClick={() => onRestore(item)}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
