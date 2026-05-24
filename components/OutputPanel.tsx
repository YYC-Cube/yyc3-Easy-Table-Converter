"use client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, Check } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"
import { formats } from "@/lib/constants/formats"

interface OutputPanelProps {
  tableData: string[][]
  outputFormat: string
  setOutputFormat: (format: string) => void
  generateOutput: (format: string, data: string[][]) => string
  handleCopy: (format: string) => void
  handleDownload: (format: string) => void
  copiedFormat: string | null
}

export const OutputPanel = ({
  tableData,
  outputFormat,
  setOutputFormat,
  generateOutput,
  handleCopy,
  handleDownload,
  copiedFormat,
}: OutputPanelProps) => {
  const { t } = useLanguage()

  return (
    <Tabs value={outputFormat} onValueChange={setOutputFormat}>
      <TabsList className="grid grid-cols-6 gap-1 h-auto p-2 bg-gray-100 rounded-xl">
        {formats.map((format) => (
          <TabsTrigger
            key={format.value}
            value={format.value}
            className="text-xs px-2 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 flex flex-col items-center gap-1"
          >
            <span className="text-sm">{format.icon}</span>
            <span>{format.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {formats.map((format) => (
        <TabsContent key={format.value} value={format.value} className="space-y-4 mt-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(format.value)}
              disabled={tableData.length === 0}
              className={`transition-all duration-200 ${
                copiedFormat === format.value
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700"
              } shadow-lg hover:shadow-xl`}
            >
              {copiedFormat === format.value ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedFormat === format.value ? t("buttons.copied") : t("buttons.copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(format.value)}
              disabled={tableData.length === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("buttons.download")}
            </Button>
          </div>

          <Textarea
            value={tableData.length > 0 ? generateOutput(format.value, tableData) : ""}
            readOnly
            className="min-h-[450px] font-mono text-sm bg-gray-50 border-gray-200 rounded-xl resize-none"
            placeholder={`${format.label}${t("placeholders.output")}`}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
