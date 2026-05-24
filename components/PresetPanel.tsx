// 预设模板面板组件
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Star, Plus, Trash2 } from "lucide-react"
import type { Preset } from "@/YYC_原油/lib/utils/presetManager"

interface PresetPanelProps {
  presets: Preset[]
  onApply?: (preset: Preset) => void
  onDelete: (id: string) => void
  onCreate: (name: string) => void
}

export function PresetPanel({ presets, onApply, onDelete, onCreate }: PresetPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [presetName, setPresetName] = useState("")

  const handleCreate = () => {
    if (presetName.trim()) {
      onCreate(presetName.trim())
      setPresetName("")
      setIsCreateOpen(false)
    }
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5" />
            预设模板
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                新建
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建预设模板</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>模板名称</Label>
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="输入模板名称..."
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {presets.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无预设模板</p>
            <p className="text-gray-400 text-xs mt-1">保存常用配置以便快速使用</p>
          </div>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onApply?.(preset)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{preset.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(preset.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(preset.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
