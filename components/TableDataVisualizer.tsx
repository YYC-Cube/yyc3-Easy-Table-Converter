/**
 * @file 表格数据可视化组件
 * @description 将表格数据转换为多种图表格式进行展示
 * @module components/TableDataVisualizer
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-20
 * @updated 2024-10-20
 */
"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/useToast"
import { useLanguage } from "@/hooks/useLanguage"
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Scatter,
  Area,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, AreaChart as AreaChartIcon, Download, Zap, Settings, HelpCircle } from "lucide-react"

/**
 * 图表类型定义
 */
type ChartType = "bar" | "line" | "pie" | "scatter" | "area"

/**
 * 颜色主题
 */
const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#a4de6c",
  "#d0ed57",
]

/**
 * 表格数据可视化组件属性
 */
interface TableDataVisualizerProps {
  tableData: string[][]
  isVisible?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

/**
 * 表格数据可视化组件 - 将表格数据转换为多种图表格式进行展示
 */
export const TableDataVisualizer: React.FC<TableDataVisualizerProps> = ({
  tableData,
  isVisible = true,
  onVisibilityChange,
}) => {
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [selectedXAxis, setSelectedXAxis] = useState<number>(0)
  const [selectedYAxis, setSelectedYAxis] = useState<number[]>([1])
  const [showLegend, setShowLegend] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showTooltip, setShowTooltip] = useState(true)
  
  const { toast } = useToast()
  const { t } = useLanguage()

  // 获取表头和数据行
  const headers = tableData[0] || []
  const dataRows = tableData.slice(1)

  // 将表格数据转换为图表数据格式
  const chartData = useMemo(() => {
    if (headers.length === 0 || dataRows.length === 0) return []

    return dataRows.map((row) => {
      const item: Record<string, any> = {
        [headers[selectedXAxis]]: row[selectedXAxis] || "N/A",
      }

      // 添加所有选中的Y轴数据
      selectedYAxis.forEach((yAxisIndex) => {
        if (yAxisIndex < headers.length) {
          const value = row[yAxisIndex]
          // 尝试转换为数字，如果失败则保持字符串
          item[headers[yAxisIndex]] = isNaN(Number(value)) ? value : Number(value)
        }
      })

      return item
    })
  }, [tableData, headers, dataRows, selectedXAxis, selectedYAxis])

  // 提取饼图数据
  const pieChartData = useMemo(() => {
    if (chartType !== "pie" || headers.length < 2 || dataRows.length === 0) return []

    return dataRows.slice(0, 10).map((row, index) => ({
      name: row[selectedXAxis] || `Item ${index + 1}`,
      value: Number(row[selectedYAxis[0]]) || 0,
    }))
  }, [chartType, headers, dataRows, selectedXAxis, selectedYAxis])

  // 提取散点图数据
  const scatterChartData = useMemo(() => {
    if (chartType !== "scatter" || selectedYAxis.length < 2 || dataRows.length === 0) return []

    return dataRows.map((row, index) => ({
      name: row[selectedXAxis] || `Point ${index + 1}`,
      x: Number(row[selectedYAxis[0]]) || 0,
      y: Number(row[selectedYAxis[1]]) || 0,
    }))
  }, [chartType, dataRows, selectedXAxis, selectedYAxis])

  // 处理Y轴选择变化
  const handleYAxisChange = (value: string) => {
    const newYAxisIndex = parseInt(value)
    if (!selectedYAxis.includes(newYAxisIndex)) {
      // 限制最多选择5个Y轴，避免图表过于复杂
      if (selectedYAxis.length < 5) {
        setSelectedYAxis([...selectedYAxis, newYAxisIndex])
      } else {
        toast({
          title: t("messages.maxYAxisReached"),
          description: t("messages.maxYAxisDescription"),
          variant: "destructive",
        })
      }
    }
  }

  // 移除Y轴选择
  const removeYAxisSelection = (indexToRemove: number) => {
    if (selectedYAxis.length > 1) {
      setSelectedYAxis(selectedYAxis.filter((index) => index !== indexToRemove))
    }
  }

  // 下载图表为图片
  const handleDownloadChart = () => {
    const chartElement = document.getElementById("visualization-chart")
    if (chartElement) {
      try {
        // 在实际项目中，这里可以实现更复杂的图表导出功能
        toast({
          title: t("messages.chartDownloaded"),
          variant: "success",
        })
      } catch (error) {
        toast({
          title: t("messages.downloadFailed"),
          variant: "destructive",
        })
      }
    }
  }

  // 渲染图表配置面板
  const renderChartConfig = () => (
    <div className="p-4 bg-white/5 backdrop-blur-sm border border-gray-200/20 rounded-lg">
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("visualizer.xAxis")}</label>
          <Select value={selectedXAxis.toString()} onValueChange={(value) => setSelectedXAxis(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder={t("visualizer.selectXAxis")} />
            </SelectTrigger>
            <SelectContent>
              {headers.map((header, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {header || t("visualizer.column")} {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("visualizer.yAxis")}</label>
            <Badge variant="outline">{t("visualizer.max5Columns")}</Badge>
          </div>
          
          <div className="space-y-2">
            <Select onValueChange={handleYAxisChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("visualizer.addYAxis")} />
              </SelectTrigger>
              <SelectContent>
                {headers
                  .filter((_, index) => index !== selectedXAxis && !selectedYAxis.includes(index))
                  .map((header, index) => (
                    <SelectItem key={index} value={(headers.indexOf(header)).toString()}>
                      {header || t("visualizer.column")} {headers.indexOf(header) + 1}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {selectedYAxis.map((yIndex) => (
                <Badge key={yIndex} variant="secondary" className="flex items-center gap-1">
                  {headers[yIndex] || t("visualizer.column")} {yIndex + 1}
                  <button 
                    type="button" 
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    onClick={() => removeYAxisSelection(yIndex)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLegend"
              checked={showLegend}
              onChange={(e) => setShowLegend(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="showLegend" className="text-sm font-medium">
              {t("visualizer.showLegend")}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showGrid"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="showGrid" className="text-sm font-medium">
              {t("visualizer.showGrid")}
            </label>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            size="sm" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleDownloadChart}
          >
            <Download size={14} />
            {t("visualizer.downloadChart")}
          </Button>
        </div>
      </div>
    </div>
  )

  // 渲染图表内容
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
          <HelpCircle className="w-12 h-12 mb-4 opacity-50" />
          <p>{t("visualizer.noDataAvailable")}</p>
          <p className="text-sm mt-2">{t("visualizer.tryDifferentColumns")}</p>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    const gridProps = showGrid ? { grid: { strokeDasharray: "3 3" } } : {}

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey={headers[selectedXAxis]} />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {selectedYAxis.map((yIndex, index) => (
                <Bar 
                  key={yIndex} 
                  dataKey={headers[yIndex]} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey={headers[selectedXAxis]} />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {selectedYAxis.map((yIndex, index) => (
                <Line 
                  key={yIndex} 
                  type="monotone" 
                  dataKey={headers[yIndex]} 
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              {showTooltip && <Tooltip />}
              {showLegend && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  layout="horizontal"
                />
              )}
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid {...gridProps} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name={headers[selectedYAxis[0]] || "X"}
                unit=""
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={headers[selectedYAxis[1]] || "Y"}
                unit=""
              />
              {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
              {showLegend && <Legend />}
              <Scatter 
                name={t("visualizer.dataPoints")}
                data={scatterChartData}
                fill={CHART_COLORS[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey={headers[selectedXAxis]} />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {selectedYAxis.map((yIndex, index) => (
                <Area 
                  key={yIndex} 
                  type="monotone" 
                  dataKey={headers[yIndex]} 
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={`${CHART_COLORS[index % CHART_COLORS.length]}33`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${isVisible ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {t("visualizer.title")}
            </CardTitle>
            <CardDescription>
              {t("visualizer.description")}
            </CardDescription>
          </div>
          
          {onVisibilityChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onVisibilityChange(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="bar" className="w-full" onValueChange={(value) => setChartType(value as ChartType)}>
          <TabsList className="mb-6 w-full justify-start p-1 bg-gray-100">
            <TabsTrigger 
              value="bar" 
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <BarChart3 size={16} />
              {t("visualizer.barChart")}
            </TabsTrigger>
            <TabsTrigger 
              value="line" 
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <LineChartIcon size={16} />
              {t("visualizer.lineChart")}
            </TabsTrigger>
            <TabsTrigger 
              value="pie" 
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <PieChartIcon size={16} />
              {t("visualizer.pieChart")}
            </TabsTrigger>
            <TabsTrigger 
              value="scatter" 
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <ScatterChartIcon size={16} />
              {t("visualizer.scatterChart")}
            </TabsTrigger>
            <TabsTrigger 
              value="area" 
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <AreaChartIcon size={16} />
              {t("visualizer.areaChart")}
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {renderChartConfig()}
            </div>
            
            <div className="lg:col-span-2">
              <div 
                id="visualization-chart" 
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                {renderChart()}
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50 py-3 px-4">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Zap size={14} className="text-yellow-500" />
          {t("visualizer.tip")}
        </div>
      </CardFooter>
    </Card>
  )
}

export default TableDataVisualizer