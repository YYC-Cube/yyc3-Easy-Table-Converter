"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Sparkles, Trash2 } from "lucide-react"
import { formats } from "@/lib/constants/formats"
import { useLanguage } from "@/hooks/useLanguage"
import { useEffect, useState } from "react"

interface InputPanelProps {
  selectedFormat: string
  setSelectedFormat: (format: string) => void
  inputData: string
  onInputChange: (value: string) => void
  onSampleData: () => void
  onClear: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const InputPanel = ({
  selectedFormat,
  setSelectedFormat,
  inputData,
  onInputChange,
  onSampleData,
  onClear,
  onFileUpload,
}: InputPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { t } = useLanguage()
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger className="w-40 bg-white border-gray-200 hover:border-blue-300 transition-colors">
            <SelectValue placeholder={t("buttons.format")} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 max-h-60">
            {formats.map((format) => (
              <SelectItem key={format.value} value={format.value} className="hover:bg-blue-50">
                <span className="flex items-center gap-2">
                  <span>{format.icon}</span>
                  {format.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={onSampleData}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {t("buttons.sample")}
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          {t("buttons.fileSelect")}
        </Button>

        <Button
          variant="outline"
          onClick={onClear}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t("buttons.clear")}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".csv,.tsv,.txt,.html,.md,.tex,.sql,.json,.yml,.yaml,.xml"
        onChange={onFileUpload}
      />

      <Textarea
        placeholder={isMounted ? `${formats.find((f) => f.value === selectedFormat)?.label}${t("placeholders.inputData")}` : "输入数据..."}
        value={inputData}
        onChange={(e) => onInputChange(e.target.value)}
        className="min-h-[350px] font-mono text-sm bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl resize-none"
      />
    </div>
  )
}
