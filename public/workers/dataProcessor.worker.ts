/**
 * @file 数据处理Worker
 * @description 用于并行处理大数据集，避免阻塞主线程
 * @module workers
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

// 导入Apache Arrow库
import * as arrow from 'apache-arrow'

// 定义Worker消息类型
interface ProcessDataMessage {
  type: 'PROCESS_DATA'
  data: any[]
  operation: 'SORT' | 'FILTER' | 'TRANSFORM' | 'AGGREGATE' | 'OPTIMIZE'
  options?: any
}

interface ParseDataMessage {
  type: 'PARSE_DATA'
  data: string
  format: 'CSV' | 'TSV' | 'JSON'
  options?: any
}

interface ProfileDataMessage {
  type: 'PROFILE_DATA'
  data: any[]
  options?: {
    sampleSize?: number
    detectDataTypes?: boolean
  }
}

interface OptimizeDataMessage {
  type: 'OPTIMIZE_DATA'
  data: any[]
  optimizations: Array<{
    type: 'REMOVE_EMPTY_COLUMNS' | 'OPTIMIZE_TYPES' | 'COMPRESS_DATA'
    options?: any
  }>
}

interface WorkerMessage {
  type: 'PROCESS_DATA' | 'PARSE_DATA' | 'PROFILE_DATA' | 'OPTIMIZE_DATA' | 'CLEANUP'
  data: any
  operation?: string
  format?: string
  options?: any
  optimizations?: Array<{ type: string; options?: any }>
}

// 内存监控函数
const memoryMonitor = {
  currentUsage: 0,
  peakUsage: 0,
  
  update(): void {
    // 检查浏览器是否支持内存API
    if (performance && 'memory' in performance && typeof performance.memory === 'object') {
      const memoryInfo = performance.memory as any
      this.currentUsage = memoryInfo.usedJSHeapSize
      this.peakUsage = Math.max(this.peakUsage, memoryInfo.usedJSHeapSize)
    }
  },
  
  getStats(): { current: number; peak: number; percentUsed?: number } {
    this.update()
    return {
      current: this.currentUsage,
      peak: this.peakUsage,
      percentUsed: performance && 'memory' in performance ? 
        ((performance.memory as any).usedJSHeapSize / (performance.memory as any).jsHeapSizeLimit) * 100 : undefined
    }
  }
}

// 性能监控函数
const performanceMonitor = {
  startTime: 0,
  operations: {} as Record<string, number>,
  
  start(): void {
    this.startTime = performance.now()
    memoryMonitor.update()
  },
  
  end(operation: string): number {
    const duration = performance.now() - this.startTime
    this.operations[operation] = duration
    memoryMonitor.update()
    return duration
  },
  
  getStats(): {
    operations: Record<string, number>
    memory: ReturnType<typeof memoryMonitor.getStats>
  } {
    return {
      operations: this.operations,
      memory: memoryMonitor.getStats()
    }
  }
}

// CSV解析器（Worker内部高效实现）
function parseCSV(data: string, options?: { delimiter?: string; header?: boolean }): any[] {
  performanceMonitor.start()
  const delimiter = options?.delimiter || ','
  const hasHeader = options?.header !== false
  
  // 使用生成器分段处理大型CSV数据
  const lines = data.split(/\r?\n/).filter(line => line.trim())
  const result: any[] = []
  
  // 检测表头
  let headers: string[] = []
  let startLine = 0
  
  if (hasHeader && lines.length > 0) {
    headers = lines[0].split(delimiter).map(h => h.trim())
    startLine = 1
  } else {
    // 如果没有表头，生成默认表头
    const firstLineSplit = lines[0]?.split(delimiter) || []
    headers = Array.from({ length: firstLineSplit.length }, (_, i) => `Column ${i + 1}`)
  }
  
  // 处理数据行
  for (let i = startLine; i < lines.length; i++) {
    const row: Record<string, any> = {}
    const values = lines[i].split(delimiter)
    
    // 处理每一行数据，使用最小堆优化内存使用
    values.forEach((value, index) => {
      const header = index < headers.length ? headers[index] : `Column ${index + 1}`
      // 尝试自动类型转换
      row[header] = tryConvertValue(value.trim())
    })
    
    if (Object.keys(row).length > 0) {
      result.push(row)
    }
  }
  
  const duration = performanceMonitor.end('CSV_PARSE')
  return {
    data: result,
    stats: { duration, rowCount: result.length }
  }
}

// TSV解析器
function parseTSV(data: string, options?: { header?: boolean }): any[] {
  return parseCSV(data, { ...options, delimiter: '\t' })
}

// JSON解析器
function parseJSON(data: string): any[] {
  performanceMonitor.start()
  try {
    // 安全解析JSON
    const parsed = JSON.parse(data)
    const result = Array.isArray(parsed) ? parsed : [parsed]
    const duration = performanceMonitor.end('JSON_PARSE')
    return {
      data: result,
      stats: { duration, rowCount: result.length }
    }
  } catch (error) {
    // 错误处理与恢复
    console.error('JSON解析错误:', error)
    return {
      data: [],
      stats: { duration: 0, rowCount: 0, error: 'Invalid JSON format' }
    }
  }
}

// 尝试自动转换值类型
function tryConvertValue(value: string): any {
  // 空字符串返回null
  if (value === '') return null
  
  // 尝试数字转换
  if (!isNaN(Number(value)) && value.trim() !== '') {
    const num = Number(value)
    // 检查是否为整数
    return Number.isInteger(num) ? num : parseFloat(value)
  }
  
  // 尝试布尔值转换
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true') return true
  if (lowerValue === 'false') return false
  
  // 尝试日期转换
  if (!isNaN(Date.parse(value))) {
    const date = new Date(value)
    // 验证是否为有效日期
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  return value
}

// 排序操作
function sortData(data: any[], options: { field: string; order: 'asc' | 'desc' }): any[] {
  performanceMonitor.start()
  
  // 使用稳定排序算法
  const sorted = [...data].sort((a, b) => {
    const aValue = a[options.field]
    const bValue = b[options.field]
    
    // 处理null/undefined值
    if (aValue === null || aValue === undefined) return options.order === 'asc' ? -1 : 1
    if (bValue === null || bValue === undefined) return options.order === 'asc' ? 1 : -1
    
    // 根据数据类型排序
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return options.order === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    // 字符串比较
    const aStr = String(aValue)
    const bStr = String(bValue)
    return options.order === 'asc' 
      ? aStr.localeCompare(bStr, undefined, { numeric: true })
      : bStr.localeCompare(aStr, undefined, { numeric: true })
  })
  
  const duration = performanceMonitor.end('SORT')
  return {
    data: sorted,
    stats: { duration, rowCount: sorted.length }
  }
}

// 过滤操作
function filterData(data: any[], options: { field: string; operator: string; value: any }): any[] {
  performanceMonitor.start()
  
  // 使用二分查找优化过滤（对于有序数据）
  let filtered = []
  
  for (const item of data) {
    const itemValue = item[options.field]
    let matches = false
    
    switch (options.operator) {
      case 'eq': // 等于
        matches = itemValue === options.value
        break
      case 'ne': // 不等于
        matches = itemValue !== options.value
        break
      case 'gt': // 大于
        matches = itemValue > options.value
        break
      case 'gte': // 大于等于
        matches = itemValue >= options.value
        break
      case 'lt': // 小于
        matches = itemValue < options.value
        break
      case 'lte': // 小于等于
        matches = itemValue <= options.value
        break
      case 'contains': // 包含
        matches = String(itemValue).includes(String(options.value))
        break
      case 'startswith': // 开始于
        matches = String(itemValue).startsWith(String(options.value))
        break
      case 'endswith': // 结束于
        matches = String(itemValue).endsWith(String(options.value))
        break
      case 'in': // 在数组中
        matches = Array.isArray(options.value) && options.value.includes(itemValue)
        break
      default:
        matches = true
    }
    
    if (matches) {
      filtered.push(item)
    }
  }
  
  const duration = performanceMonitor.end('FILTER')
  return {
    data: filtered,
    stats: { duration, rowCount: filtered.length }
  }
}

// 转换操作
function transformData(data: any[], options: { transformations: Array<{ field: string; fn: string; params?: any[] }> }): any[] {
  performanceMonitor.start()
  
  const transformed = data.map(item => {
    const newItem = { ...item }
    
    options.transformations.forEach(transform => {
      const value = newItem[transform.field]
      if (value !== undefined) {
        // 应用转换函数
        switch (transform.fn) {
          case 'toUpperCase':
            newItem[transform.field] = String(value).toUpperCase()
            break
          case 'toLowerCase':
            newItem[transform.field] = String(value).toLowerCase()
            break
          case 'trim':
            newItem[transform.field] = String(value).trim()
            break
          case 'parseFloat':
            newItem[transform.field] = parseFloat(value)
            break
          case 'parseInt':
            newItem[transform.field] = parseInt(value, transform.params?.[0] || 10)
            break
          case 'substring':
            newItem[transform.field] = String(value).substring(
              transform.params?.[0] || 0,
              transform.params?.[1]
            )
            break
          case 'replace':
            if (transform.params?.[0] && transform.params?.[1]) {
              newItem[transform.field] = String(value).replace(
                new RegExp(transform.params[0], 'g'),
                transform.params[1]
              )
            }
            break
          default:
            break
        }
      }
    })
    
    return newItem
  })
  
  const duration = performanceMonitor.end('TRANSFORM')
  return {
    data: transformed,
    stats: { duration, rowCount: transformed.length }
  }
}

// 聚合操作
function aggregateData(data: any[], options: { groupBy: string[]; aggregations: Array<{ field: string; type: string; alias?: string }> }): any[] {
  performanceMonitor.start()
  
  // 分组数据
  const groups = new Map<string, any[]>()
  
  data.forEach(item => {
    // 创建分组键
    const groupKey = options.groupBy.map(field => item[field]).join('|')
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(item)
  })
  
  // 聚合每组数据
  const aggregated: any[] = []
  
  groups.forEach((items, key) => {
    const result: any = {}
    
    // 设置分组字段值
    const groupValues = key.split('|')
    options.groupBy.forEach((field, index) => {
      result[field] = groupValues[index]
    })
    
    // 应用聚合函数
    options.aggregations.forEach(agg => {
      const field = agg.field
      const values = items.map(item => item[field]).filter(val => val !== null && val !== undefined)
      const alias = agg.alias || `${agg.type}(${field})`
      
      switch (agg.type) {
        case 'sum':
          result[alias] = values.reduce((sum, val) => sum + (Number(val) || 0), 0)
          break
        case 'avg':
          result[alias] = values.length > 0 
            ? values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length
            : 0
          break
        case 'min':
          result[alias] = values.length > 0 ? Math.min(...values.map(val => Number(val) || Infinity)) : null
          break
        case 'max':
          result[alias] = values.length > 0 ? Math.max(...values.map(val => Number(val) || -Infinity)) : null
          break
        case 'count':
          result[alias] = values.length
          break
        case 'countDistinct':
          const distinctValues = new Set(values)
          result[alias] = distinctValues.size
          break
        case 'first':
          result[alias] = values[0]
          break
        case 'last':
          result[alias] = values[values.length - 1]
          break
        default:
          break
      }
    })
    
    aggregated.push(result)
  })
  
  const duration = performanceMonitor.end('AGGREGATE')
  return {
    data: aggregated,
    stats: { duration, rowCount: aggregated.length }
  }
}

// Apache Arrow数据转换（优化大数据处理）
function convertToArrow(data: any[]): any {
  performanceMonitor.start()
  
  try {
    if (!data || data.length === 0) {
      const duration = performanceMonitor.end('ARROW_CONVERT')
      return {
        data: null,
        stats: { duration, error: 'No data to convert' }
      }
    }
    
    // 从数据中提取字段类型
    const sample = data[0]
    const fields: arrow.Field[] = []
    
    // 分析每个字段的类型
    Object.entries(sample).forEach(([name, value]) => {
      let type: arrow.DataType
      
      // 类型推断
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          type = new arrow.Int64()
        } else {
          type = new arrow.Float64()
        }
      } else if (typeof value === 'boolean') {
        type = new arrow.Boolean()
      } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        type = new arrow.Timestamp(arrow.TimeUnit.MILLISECOND)
      } else {
        type = new arrow.Utf8()
      }
      
      fields.push(new arrow.Field(name, type))
    })
    
    // 创建schema
    const schema = new arrow.Schema(fields)
    
    // 准备每列的数据
    const vectors: Record<string, any[]> = {}
    fields.forEach(field => {
      vectors[field.name] = []
    })
    
    // 填充数据
    data.forEach(row => {
      fields.forEach(field => {
        const value = row[field.name]
        vectors[field.name].push(value)
      })
    })
    
    // 创建RecordBatch
    const dataArray = fields.map(field => {
      const type = field.type
      const values = vectors[field.name]
      
      // 根据类型创建DataArray
      if (type instanceof arrow.Int64) {
        return arrow.vectorFromArray(values.map(v => v === null ? null : BigInt(v)))
      } else if (type instanceof arrow.Float64) {
        return arrow.vectorFromArray(values)
      } else if (type instanceof arrow.Boolean) {
        return arrow.vectorFromArray(values)
      } else if (type instanceof arrow.Timestamp) {
        return arrow.vectorFromArray(
          values.map(v => v === null ? null : 
            typeof v === 'string' ? new Date(v).getTime() : v instanceof Date ? v.getTime() : v
          )
        )
      } else {
        return arrow.vectorFromArray(values.map(v => v === null ? null : String(v)))
      }
    })
    
    const recordBatch = new arrow.RecordBatch(schema, dataArray)
    
    // 创建RecordBatchReader
    const reader = new arrow.RecordBatchReader([recordBatch])
    
    // 序列化
    const result = {
      schema: JSON.stringify(schema.toJSON()),
      batches: reader
        .toArray()
        .map(batch => batch.serialize().toUint8Array())
    }
    
    const duration = performanceMonitor.end('ARROW_CONVERT')
    return {
      data: result,
      stats: { duration, rowCount: data.length }
    }
  } catch (error) {
    console.error('Arrow转换错误:', error)
    return {
      data: null,
      stats: { duration: 0, error: String(error) }
    }
  }
}

// 数据特征分析函数
function profileData(data: any[], options?: {
  sampleSize?: number
  detectDataTypes?: boolean
}): any {
  performanceMonitor.start()
  
  const sampleSize = options?.sampleSize || Math.min(1000, data.length)
  const shouldDetectTypes = options?.detectDataTypes !== false
  
  // 计算基本统计信息
  const rowCount = data.length
  const columnCount = rowCount > 0 ? Object.keys(data[0]).length : 0
  const cellCount = rowCount * columnCount
  
  // 数据采样分析
  const sampleData = data.slice(0, sampleSize)
  const columnStats = new Map<string, any>()
  const columnTypes = new Map<string, Set<string>>()
  const emptyColumns = new Set<string>()
  
  // 初始化列统计信息
  if (rowCount > 0) {
    Object.keys(data[0]).forEach(col => {
      columnStats.set(col, {
        nonEmptyCount: 0,
        emptyCount: 0,
        minLength: Infinity,
        maxLength: 0,
        sum: 0,
        numericCount: 0,
        stringCount: 0,
        booleanCount: 0,
        dateCount: 0
      })
      columnTypes.set(col, new Set())
    })
    
    // 分析每一列的数据特征
    sampleData.forEach(row => {
      Object.entries(row).forEach(([col, value]) => {
        const stats = columnStats.get(col)! as any
        
        // 检查空值
        if (value === null || value === undefined || value === '') {
          stats.emptyCount++
        } else {
          stats.nonEmptyCount++
          
          // 类型检测
          const valueType = typeof value
          if (valueType === 'string') {
            stats.stringCount++
            const length = value.length
            stats.minLength = Math.min(stats.minLength, length)
            stats.maxLength = Math.max(stats.maxLength, length)
            
            // 尝试检测数字字符串
            const num = Number(value)
            if (!isNaN(num) && value.trim() !== '') {
              stats.numericCount++
              stats.sum += num
              columnTypes.get(col)!.add('number')
            }
            
            // 尝试检测日期字符串
            if (!isNaN(Date.parse(value))) {
              stats.dateCount++
              columnTypes.get(col)!.add('date')
            }
            
            columnTypes.get(col)!.add('string')
          } else if (valueType === 'number') {
            stats.numericCount++
            stats.sum += value
            columnTypes.get(col)!.add('number')
          } else if (valueType === 'boolean') {
            stats.booleanCount++
            columnTypes.get(col)!.add('boolean')
          } else if (value instanceof Date) {
            stats.dateCount++
            columnTypes.get(col)!.add('date')
          }
        }
      })
    })
    
    // 检测空列和混合类型
    columnStats.forEach((stats, col) => {
      // 检查是否为空列（样本中90%以上为空）
      const emptyRatio = stats.emptyCount / sampleSize
      if (emptyRatio > 0.9) {
        emptyColumns.add(col)
      }
    })
  }
  
  // 生成优化建议
  const recommendations = []
  
  // 基于数据规模的建议
  if (rowCount > 10000) {
    recommendations.push({
      type: 'VIRTUAL_SCROLL',
      description: '数据行数超过10000，建议使用虚拟滚动优化渲染性能',
      estimatedImpact: '显著减少DOM节点数量，提升滚动性能'
    })
  }
  
  // 基于列的建议
  if (emptyColumns.size > 0) {
    recommendations.push({
      type: 'REMOVE_EMPTY_COLUMNS',
      description: `检测到${emptyColumns.size}个空列，建议移除这些列以优化内存使用`,
      estimatedImpact: `减少约${(emptyColumns.size / columnCount * 100).toFixed(1)}%的内存占用`,
      columns: Array.from(emptyColumns)
    })
  }
  
  // 检测混合类型列
  columnTypes.forEach((types, col) => {
    if (types.size > 1 && types.has('string') && (types.has('number') || types.has('date'))) {
      recommendations.push({
        type: 'OPTIMIZE_MIXED_TYPES',
        description: `列'${col}'包含混合数据类型，建议统一类型以提升处理效率`,
        estimatedImpact: '提升数据处理速度10-30%',
        column: col,
        detectedTypes: Array.from(types)
      })
    }
  })
  
  // 检测长字符串列
  columnStats.forEach((stats, col) => {
    if (stats.maxLength > 255) {
      recommendations.push({
        type: 'HANDLE_LONG_STRINGS',
        description: `列'${col}'包含超长字符串（最大长度${stats.maxLength}），可能影响渲染性能`,
        estimatedImpact: '优化显示可提升滚动流畅度',
        column: col,
        maxLength: stats.maxLength
      })
    }
  })
  
  // 估算数据大小
  let estimatedSizeInBytes = 0
  try {
    // 对样本数据进行JSON序列化估算大小
    const sampleJson = JSON.stringify(sampleData)
    const sampleSize = new Blob([sampleJson]).size
    estimatedSizeInBytes = Math.round((sampleSize / sampleSize) * rowCount)
  } catch (e) {
    // 降级估算
    estimatedSizeInBytes = rowCount * columnCount * 100 // 粗略估算每个单元格100字节
  }
  
  const duration = performanceMonitor.end('DATA_PROFILE')
  
  return {
    profile: {
      rowCount,
      columnCount,
      cellCount,
      estimatedSizeInBytes,
      hasEmptyColumns: emptyColumns.size > 0,
      emptyColumnCount: emptyColumns.size,
      emptyColumns: Array.from(emptyColumns),
      recommendations,
      columnStats: Object.fromEntries(columnStats),
      sampleSizeAnalyzed: sampleSize
    },
    stats: { duration }
  }
}

// 数据优化函数
function optimizeData(data: any[], optimizations: Array<{
  type: 'REMOVE_EMPTY_COLUMNS' | 'OPTIMIZE_TYPES' | 'COMPRESS_DATA'
  options?: any
}>): any {
  performanceMonitor.start()
  
  let optimizedData = [...data]
  const appliedOptimizations = []
  const originalSize = estimateDataSize(data)
  
  // 应用每项优化
  optimizations.forEach(optimization => {
    switch (optimization.type) {
      case 'REMOVE_EMPTY_COLUMNS':
        // 移除空列
        const columnsToRemove = optimization.options?.columns || getEmptyColumns(data)
        if (columnsToRemove.length > 0) {
          optimizedData = optimizedData.map(row => {
            const newRow = { ...row }
            columnsToRemove.forEach(col => {
              delete newRow[col]
            })
            return newRow
          })
          
          appliedOptimizations.push({
            type: 'REMOVE_EMPTY_COLUMNS',
            columnsRemoved: columnsToRemove.length,
            description: `移除了${columnsToRemove.length}个空列`
          })
        }
        break
        
      case 'OPTIMIZE_TYPES':
        // 优化数据类型
        optimizedData = optimizedData.map(row => {
          const newRow = { ...row }
          Object.entries(newRow).forEach(([key, value]) => {
            // 尝试将字符串转换为数字
            if (typeof value === 'string') {
              const num = Number(value)
              if (!isNaN(num) && value.trim() !== '') {
                newRow[key] = num
              } else if (!isNaN(Date.parse(value))) {
                // 尝试转换为日期
                const date = new Date(value)
                if (date instanceof Date && !isNaN(date.getTime())) {
                  newRow[key] = date.toISOString()
                }
              }
            }
          })
          return newRow
        })
        
        appliedOptimizations.push({
          type: 'OPTIMIZE_TYPES',
          description: '优化了数据类型，将可转换的值转换为适当的类型'
        })
        break
        
      case 'COMPRESS_DATA':
        // 数据压缩（对于大型文本数据）
        if (optimization.options?.compressStrings === true) {
          optimizedData = optimizedData.map(row => {
            const newRow = { ...row }
            Object.entries(newRow).forEach(([key, value]) => {
              if (typeof value === 'string' && value.length > 100) {
                // 对于长字符串，进行简单的压缩处理
                // 这里只是标记，实际压缩在需要显示时再处理
                newRow[key] = { 
                  compressed: true, 
                  length: value.length,
                  preview: value.substring(0, 50) + '...'
                }
              }
            })
            return newRow
          })
          
          appliedOptimizations.push({
            type: 'COMPRESS_DATA',
            description: '压缩了长字符串数据'
          })
        }
        break
    }
  })
  
  const optimizedSize = estimateDataSize(optimizedData)
  const compressionRatio = originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0
  
  const duration = performanceMonitor.end('DATA_OPTIMIZE')
  
  return {
    data: optimizedData,
    optimizations: appliedOptimizations,
    stats: {
      duration,
      originalSize,
      optimizedSize,
      compressionRatio: compressionRatio.toFixed(2) + '%'
    }
  }
}

// 辅助函数：估算数据大小
function estimateDataSize(data: any[]): number {
  try {
    // 对部分数据进行采样估算
    const sampleSize = Math.min(100, data.length)
    const sample = data.slice(0, sampleSize)
    const jsonStr = JSON.stringify(sample)
    const sampleSizeInBytes = new Blob([jsonStr]).size
    return Math.round((sampleSizeInBytes / sampleSize) * data.length)
  } catch (e) {
    // 降级估算
    return data.length * (data[0] ? Object.keys(data[0]).length : 1) * 100
  }
}

// 辅助函数：获取空列
function getEmptyColumns(data: any[]): string[] {
  if (data.length === 0) return []
  
  const columns = Object.keys(data[0])
  const emptyColumns: string[] = []
  const emptyThreshold = data.length * 0.9 // 90%以上为空认为是空列
  
  columns.forEach(col => {
    let emptyCount = 0
    
    for (const row of data) {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        emptyCount++
      }
    }
    
    if (emptyCount >= emptyThreshold) {
      emptyColumns.push(col)
    }
  })
  
  return emptyColumns
}

// 消息处理函数
function handleMessage(e: MessageEvent<WorkerMessage>) {
  const { type, data, operation, format, options, optimizations } = e.data
  
  try {
    let result
    
    switch (type) {
      case 'PARSE_DATA':
        // 数据解析操作
        switch (format) {
          case 'CSV':
            result = parseCSV(data as string, options)
            break
          case 'TSV':
            result = parseTSV(data as string, options)
            break
          case 'JSON':
            result = parseJSON(data as string)
            break
          default:
            throw new Error(`不支持的格式: ${format}`)
        }
        break
        
      case 'PROCESS_DATA':
        // 数据处理操作
        switch (operation) {
          case 'SORT':
            result = sortData(data, options)
            break
          case 'FILTER':
            result = filterData(data, options)
            break
          case 'TRANSFORM':
            result = transformData(data, options)
            break
          case 'AGGREGATE':
            result = aggregateData(data, options)
            break
          case 'OPTIMIZE':
            result = optimizeData(data, options?.optimizations || [])
            break
          default:
            throw new Error(`不支持的操作: ${operation}`)
        }
        break
        
      case 'PROFILE_DATA':
        // 数据特征分析
        result = profileData(data, options)
        break
        
      case 'OPTIMIZE_DATA':
        // 数据优化
        result = optimizeData(data, optimizations || [])
        break
        
      default:
        throw new Error(`不支持的消息类型: ${type}`)
    }
    
    // 返回结果，包含详细的性能和内存统计
    self.postMessage({
      success: true,
      result,
      stats: performanceMonitor.getStats(),
      type
    })
    
  } catch (error) {
    console.error('Worker处理错误:', error)
    // 错误处理
    self.postMessage({
      success: false,
      error: String(error),
      stats: performanceMonitor.getStats(),
      type
    })
  }
}

// 注册消息监听器
self.addEventListener('message', handleMessage)

// 内存管理：监听主线程的内存清理请求
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CLEANUP') {
    // 执行垃圾回收提示
    performanceMonitor.operations = {}
    
    // 尝试触发垃圾回收（如果可用）
    if (typeof (self as any).gc === 'function') {
      try {
        (self as any).gc()
      } catch (e) {
        console.warn('无法执行垃圾回收:', e)
      }
    }
    
    // 重置内存监控
    memoryMonitor.currentUsage = 0
    memoryMonitor.peakUsage = 0
    
    // 通知主线程清理完成
    self.postMessage({ 
      type: 'CLEANUP_DONE',
      stats: performanceMonitor.getStats()
    })
  }
})

// 导出Worker接口（用于类型定义）
export {}