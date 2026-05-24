// 批量处理面板组件
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X, Download, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react"
import type { BatchTask } from "@/YYC_原油/lib/utils/batchProcessor"

interface BatchProcessorPanelProps {
  tasks: BatchTask[]
  onRemoveTask: (id: string) => void
  onClearCompleted: () => void
  onClearAll: () => void
  onDownload?: (task: BatchTask) => void
}

export function BatchProcessorPanel({
  tasks,
  onRemoveTask,
  onClearCompleted,
  onClearAll,
  onDownload,
}: BatchProcessorPanelProps) {
  if (tasks.length === 0) return null

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const errorCount = tasks.filter((t) => t.status === "error").length
  const processingCount = tasks.filter((t) => t.status === "processing").length

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">批量处理队列</CardTitle>
          <div className="flex gap-2">
            {completedCount > 0 && (
              <Button variant="outline" size="sm" onClick={onClearCompleted}>
                <Trash2 className="w-4 h-4 mr-1" />
                清除已完成
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClearAll}>
              清空全部
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-gray-600">
            总计: <strong>{tasks.length}</strong>
          </span>
          {processingCount > 0 && (
            <span className="text-blue-600">
              处理中: <strong>{processingCount}</strong>
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-green-600">
              已完成: <strong>{completedCount}</strong>
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-red-600">
              失败: <strong>{errorCount}</strong>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {task.status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
                {task.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                {task.status === "processing" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {task.status === "pending" && <div className="w-5 h-5 rounded-full bg-gray-300" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.file.name}</p>
                  <Badge
                    variant={
                      task.status === "completed" ? "default" : task.status === "error" ? "destructive" : "secondary"
                    }
                    className="ml-2"
                  >
                    {task.status === "completed" && "完成"}
                    {task.status === "error" && "失败"}
                    {task.status === "processing" && "处理中"}
                    {task.status === "pending" && "等待"}
                  </Badge>
                </div>

                {task.status === "processing" && <Progress value={task.progress} className="h-1.5" />}

                {task.status === "error" && task.error && <p className="text-xs text-red-600 mt-1">{task.error}</p>}

                {task.status === "completed" && <p className="text-xs text-green-600 mt-1">转换成功</p>}
              </div>

              <div className="flex gap-1">
                {task.status === "completed" && onDownload && (
                  <Button variant="ghost" size="sm" onClick={() => onDownload(task)}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onRemoveTask(task.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
