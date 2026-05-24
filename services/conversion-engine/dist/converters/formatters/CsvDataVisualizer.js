"use strict";
/**
 * @file CSV数据可视化工具
 * @description 将CSV数据转换为多种可视化图表格式，支持交互式图表生成
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvDataVisualizer = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * CSV数据可视化工具类
 */
class CsvDataVisualizer extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV数据可视化工具', '将CSV数据转换为多种可视化图表格式，支持交互式图表生成', ['csv'], ['html', 'svg', 'png', 'json']);
    }
    /**
     * 执行CSV数据可视化
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 可视化选项
     */
    async convert(inputData, inputFormat, outputFormat, options) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 验证必需选项
            if (!options.chartType) {
                return this.createErrorResult('缺少必需的选项：chartType');
            }
            // 设置默认选项
            const visualOptions = {
                // 图表配置
                chartTheme: options.chartTheme || 'default',
                title: options.title || '',
                subtitle: options.subtitle || '',
                description: options.description || '',
                // 数据配置
                xAxis: {
                    show: true,
                    grid: true,
                    scale: true,
                    ...options.xAxis
                },
                yAxis: {
                    show: true,
                    grid: true,
                    scale: true,
                    ...options.yAxis
                },
                series: options.series || [],
                // 外观配置
                legend: {
                    show: true,
                    position: 'top',
                    orient: 'horizontal',
                    ...options.legend
                },
                tooltip: {
                    show: true,
                    trigger: 'axis',
                    ...options.tooltip
                },
                backgroundColor: options.backgroundColor || '#ffffff',
                // 交互配置
                interaction: {
                    enabled: true,
                    zoom: false,
                    pan: false,
                    select: false,
                    zoomOnWheel: false,
                    panOnDrag: false,
                    ...options.interaction
                },
                // 动画配置
                animation: {
                    enabled: true,
                    duration: 1000,
                    easing: 'cubicOut',
                    delay: 0,
                    ...options.animation
                },
                // 导出配置
                export: {
                    enabled: true,
                    formats: ['png', 'svg', 'pdf'],
                    filename: options.title ? options.title.replace(/\s+/g, '_') : 'chart',
                    ...options.export
                },
                // 数据处理
                dataProcess: {
                    sortOrder: 'asc',
                    ...options.dataProcess
                },
                // 响应式配置
                responsive: {
                    enabled: true,
                    width: '100%',
                    height: 400,
                    maintainAspectRatio: true,
                    autoResize: true,
                    ...options.responsive
                },
                // 高级配置
                renderEngine: options.renderEngine || 'canvas',
                canvasId: options.canvasId || `chart_${Date.now()}`,
                // CSV解析选项
                csvOptions: {
                    delimiter: ',',
                    header: true,
                    quote: '"',
                    escape: '\\',
                    skipLines: 0,
                    encoding: 'utf8',
                    ...options.csvOptions
                },
                ...options
            };
            // 执行可视化并测量性能
            const { result: visualizationData, duration } = await this.measurePerformance(() => {
                return this.createVisualization(inputData, outputFormat, visualOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(visualizationData, outputFormat, inputFormat, {
                chartType: options.chartType,
                chartSize: visualizationData.metadata?.chartSize || { width: 800, height: 600 },
                processingTime: duration,
                renderEngine: visualOptions.renderEngine
            });
        }
        catch (error) {
            logger_1.logger.error('CSV数据可视化失败:', error);
            return this.createErrorResult(`可视化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 创建可视化
     * @param inputData CSV输入数据
     * @param outputFormat 输出格式
     * @param options 可视化选项
     */
    createVisualization(inputData, outputFormat, options) {
        try {
            // 解析CSV数据（模拟）
            const csvData = this.parseCsvData(inputData, options.csvOptions);
            // 处理数据
            const processedData = this.processData(csvData, options.dataProcess);
            // 根据图表类型生成可视化
            const chartData = this.generateChartData(processedData, options);
            // 根据输出格式生成结果
            let result;
            switch (outputFormat) {
                case 'html':
                    result = this.generateHtmlOutput(chartData, options);
                    break;
                case 'svg':
                    result = this.generateSvgOutput(chartData, options);
                    break;
                case 'json':
                    result = JSON.stringify({
                        chartType: options.chartType,
                        chartData,
                        options
                    }, null, 2);
                    break;
                case 'png':
                    // 在实际实现中，这里会生成PNG图像
                    result = this.generateHtmlOutput(chartData, options); // 模拟，实际应生成PNG
                    break;
                default:
                    throw new Error(`不支持的输出格式: ${outputFormat}`);
            }
            return typeof result === 'string' ? Buffer.from(result) : result;
        }
        catch (error) {
            logger_1.logger.error('可视化创建错误:', error);
            throw error;
        }
    }
    /**
     * 解析CSV数据
     */
    parseCsvData(inputData, csvOptions) {
        // 模拟CSV解析逻辑
        const csvString = inputData.toString();
        const lines = csvString.split('\n').filter(line => line.trim());
        const { delimiter = ',', header = true, skipLines = 0 } = csvOptions;
        // 跳过指定行数
        let processLines = lines.slice(skipLines);
        // 提取表头和数据
        let headers = [];
        let data = [];
        if (processLines.length > 0) {
            if (header) {
                headers = processLines[0].split(delimiter).map(h => h.trim());
                processLines = processLines.slice(1);
            }
            else {
                // 如果没有表头，创建默认表头
                const firstLineParts = processLines[0].split(delimiter);
                headers = firstLineParts.map((_, index) => `field_${index + 1}`);
            }
            // 解析数据行
            data = processLines.map(line => {
                const values = line.split(delimiter);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = index < values.length ? values[index].trim() : '';
                });
                return row;
            });
        }
        return { headers, data };
    }
    /**
     * 处理数据
     */
    processData(csvData, processConfig) {
        let { headers, data } = csvData;
        // 克隆数据以避免修改原始数据
        const processedData = [...data];
        // 数据排序
        if (processConfig.sortBy && headers.includes(processConfig.sortBy)) {
            processedData.sort((a, b) => {
                const valA = a[processConfig.sortBy];
                const valB = b[processConfig.sortBy];
                // 尝试数字比较
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return processConfig.sortOrder === 'asc' ? numA - numB : numB - numA;
                }
                // 字符串比较
                if (processConfig.sortOrder === 'asc') {
                    return String(valA).localeCompare(String(valB));
                }
                else {
                    return String(valB).localeCompare(String(valA));
                }
            });
        }
        // 数据过滤
        if (processConfig.filterBy && headers.includes(processConfig.filterBy)) {
            data = processedData.filter(row => {
                const value = row[processConfig.filterBy];
                const filterValue = processConfig.filterValue;
                const operator = processConfig.filterOperator || '=';
                switch (operator) {
                    case '=':
                        return value === filterValue;
                    case '!=':
                        return value !== filterValue;
                    case '>':
                        return parseFloat(value) > parseFloat(filterValue);
                    case '<':
                        return parseFloat(value) < parseFloat(filterValue);
                    case '>=':
                        return parseFloat(value) >= parseFloat(filterValue);
                    case '<=':
                        return parseFloat(value) <= parseFloat(filterValue);
                    case 'contains':
                        return String(value).includes(String(filterValue));
                    case 'not_contains':
                        return !String(value).includes(String(filterValue));
                    default:
                        return true;
                }
            });
        }
        // 数据限制
        if (processConfig.limit && data.length > processConfig.limit) {
            data = data.slice(processConfig.offset || 0, (processConfig.offset || 0) + processConfig.limit);
        }
        return { headers, data };
    }
    /**
     * 生成图表数据
     */
    generateChartData(processedData, options) {
        const { headers, data } = processedData;
        const chartData = {};
        // 根据图表类型生成数据
        switch (options.chartType) {
            case 'bar':
            case 'line':
            case 'area':
                chartData.xAxis = this.extractAxisData(data, options.xAxis?.field || headers[0]);
                chartData.series = this.extractSeriesData(data, headers, options);
                break;
            case 'pie':
            case 'doughnut':
                chartData.series = this.extractPieData(data, headers, options);
                break;
            case 'scatter':
                chartData.series = this.extractScatterData(data, headers, options);
                break;
            case 'histogram':
                chartData.series = this.extractHistogramData(data, headers, options);
                break;
            case 'box':
                chartData.series = this.extractBoxData(data, headers, options);
                break;
            case 'radar':
                chartData.series = this.extractRadarData(data, headers, options);
                break;
            case 'heatmap':
                chartData.series = this.extractHeatmapData(data, headers, options);
                break;
            default:
                throw new Error(`不支持的图表类型: ${options.chartType}`);
        }
        return chartData;
    }
    /**
     * 提取坐标轴数据
     */
    extractAxisData(data, field) {
        return data.map(row => row[field]);
    }
    /**
     * 提取系列数据
     */
    extractSeriesData(data, headers, options) {
        // 如果有配置的系列，使用配置的系列
        if (options.series && options.series.length > 0) {
            return options.series.map(series => {
                return {
                    name: series.name || series.field,
                    type: series.type || options.chartType,
                    data: data.map(row => parseFloat(row[series.field]) || 0),
                    color: series.color,
                    stack: series.stack,
                    smooth: series.smooth
                };
            });
        }
        // 否则自动检测数值列作为系列
        const numericHeaders = headers.filter(header => {
            // 假设除了第一个列外，其他可能是数值列
            return header !== options.xAxis?.field;
        });
        return numericHeaders.map(header => {
            return {
                name: header,
                type: options.chartType,
                data: data.map(row => parseFloat(row[header]) || 0)
            };
        });
    }
    /**
     * 提取饼图数据
     */
    extractPieData(data, headers, options) {
        const categoryField = options.xAxis?.field || headers[0];
        const valueField = headers.find(header => header !== categoryField) || headers[1];
        return [{
                name: '饼图数据',
                type: 'pie',
                data: data.map(row => ({
                    name: row[categoryField],
                    value: parseFloat(row[valueField]) || 0
                }))
            }];
    }
    /**
     * 提取散点图数据
     */
    extractScatterData(data, headers, options) {
        const xField = options.xAxis?.field || headers[0];
        const yField = options.yAxis?.field || headers[1];
        return [{
                name: '散点数据',
                type: 'scatter',
                data: data.map(row => ([
                    parseFloat(row[xField]) || 0,
                    parseFloat(row[yField]) || 0
                ]))
            }];
    }
    /**
     * 提取直方图数据
     */
    extractHistogramData(data, headers, options) {
        const valueField = options.yAxis?.field || headers[1];
        const values = data.map(row => parseFloat(row[valueField]) || 0).filter(v => !isNaN(v));
        // 简单的直方图数据处理
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = 10;
        const binWidth = (max - min) / binCount;
        const bins = Array.from({ length: binCount }, () => 0);
        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
            bins[binIndex]++;
        });
        return [{
                name: '直方图数据',
                type: 'bar',
                data: bins
            }];
    }
    /**
     * 提取箱线图数据
     */
    extractBoxData(data, headers, options) {
        const valueField = options.yAxis?.field || headers[1];
        const values = data.map(row => parseFloat(row[valueField]) || 0).filter(v => !isNaN(v)).sort((a, b) => a - b);
        const quartile = (q) => {
            const pos = (values.length - 1) * q;
            const lower = Math.floor(pos);
            const upper = Math.ceil(pos);
            const weight = pos - lower;
            return values[lower] * (1 - weight) + values[upper] * weight;
        };
        return [{
                name: '箱线图数据',
                type: 'box',
                data: [
                    {
                        name: valueField,
                        value: [
                            values[0], // min
                            quartile(0.25), // Q1
                            quartile(0.5), // median
                            quartile(0.75), // Q3
                            values[values.length - 1] // max
                        ]
                    }
                ]
            }];
    }
    /**
     * 提取雷达图数据
     */
    extractRadarData(data, headers, options) {
        // 雷达图需要多维度数据
        const dimensions = headers.slice(1, 6); // 取前5个维度
        const firstRow = data[0];
        return [{
                name: '雷达图数据',
                type: 'radar',
                data: [{
                        name: firstRow[headers[0]] || '数据',
                        value: dimensions.map(dim => parseFloat(firstRow[dim]) || 0)
                    }],
                indicator: dimensions.map(dim => ({
                    name: dim,
                    max: Math.max(...data.map(row => parseFloat(row[dim]) || 0))
                }))
            }];
    }
    /**
     * 提取热力图数据
     */
    extractHeatmapData(data, headers, options) {
        const xField = options.xAxis?.field || headers[0];
        const yField = headers.find(h => h !== xField) || headers[1];
        const valueField = headers.find(h => h !== xField && h !== yField) || headers[2];
        return [{
                name: '热力图数据',
                type: 'heatmap',
                data: data.map(row => ([
                    row[xField],
                    row[yField],
                    parseFloat(row[valueField]) || 0
                ]))
            }];
    }
    /**
     * 生成HTML输出
     */
    generateHtmlOutput(chartData, options) {
        const width = options.responsive?.width || '100%';
        const height = options.responsive?.height || 400;
        // 生成包含ECharts的HTML
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'CSV数据可视化'}</title>
  <!-- 引入ECharts -->
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .chart-container { background: ${options.backgroundColor || '#ffffff'}; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .chart-title { text-align: center; margin-bottom: 10px; }
    .chart-subtitle { text-align: center; margin-bottom: 20px; color: #666; font-size: 14px; }
    .chart-description { margin-bottom: 20px; color: #777; font-size: 14px; }
    #${options.canvasId} { width: ${width}; height: ${height}px; margin: 0 auto; }
    .chart-actions { text-align: center; margin-top: 20px; }
    .chart-actions button { margin: 0 5px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .chart-actions button:hover { background: #2980b9; }
    .chart-info { margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="chart-container">
    ${options.title ? `<h2 class="chart-title">${options.title}</h2>` : ''}
    ${options.subtitle ? `<p class="chart-subtitle">${options.subtitle}</p>` : ''}
    ${options.description ? `<p class="chart-description">${options.description}</p>` : ''}
    <div id="${options.canvasId}"></div>
    ${options.export?.enabled ? `
    <div class="chart-actions">
      ${options.export?.formats?.includes('png') ? `<button onclick="exportChart('png')">导出PNG</button>` : ''}
      ${options.export?.formats?.includes('jpeg') ? `<button onclick="exportChart('jpeg')">导出JPEG</button>` : ''}
      ${options.export?.formats?.includes('svg') ? `<button onclick="exportChart('svg')">导出SVG</button>` : ''}
      ${options.export?.formats?.includes('pdf') ? `<button onclick="exportChart('pdf')">导出PDF</button>` : ''}
    </div>` : ''}
    <div class="chart-info">
      <p>图表类型: ${this.getChartTypeName(options.chartType)}</p>
      <p>数据处理: ${options.dataProcess ? '已应用' : '默认'}</p>
      <p>渲染引擎: ${options.renderEngine}</p>
    </div>
  </div>

  <script>
    // 初始化ECharts实例
    const chart = echarts.init(document.getElementById('${options.canvasId}'), '${this.getEChartsTheme(options.chartTheme)}');
    
    // 构建图表配置
    const option = {
      title: {
        show: ${options.title ? 'true' : 'false'},
        text: '${options.title || ''}',
        subtext: '${options.subtitle || ''}',
        left: 'center'
      },
      tooltip: {
        show: ${options.tooltip?.show},
        trigger: '${options.tooltip?.trigger}'
      },
      legend: {
        show: ${options.legend?.show},
        orient: '${options.legend?.orient}',
        left: '${options.legend?.position === 'left' || options.legend?.position === 'right' ? options.legend?.position : 'center'}',
        top: '${options.legend?.position === 'top' || options.legend?.position === 'bottom' ? options.legend?.position : 'auto'}'
      },
      ${this.generateAxisConfig('xAxis', options.xAxis)},      
      ${this.generateAxisConfig('yAxis', options.yAxis)},      
      series: ${JSON.stringify(chartData.series || [])},
      animation: ${options.animation?.enabled},
      animationDuration: ${options.animation?.duration},
      animationEasing: '${options.animation?.easing}'
    };
    
    // 设置图表配置
    chart.setOption(option);
    
    // 响应式调整
    ${options.responsive?.autoResize ? `
    window.addEventListener('resize', function() {
      chart.resize();
    });` : ''}
    
    // 导出功能
    function exportChart(format) {
      const filename = '${options.export?.filename || 'chart'}';
      
      if (format === 'png') {
        const url = chart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '${options.export?.backgroundColor || options.backgroundColor || '#ffffff}'});
        downloadUrl(url, filename + '.png');
      } else if (format === 'jpeg') {
        const url = chart.getDataURL({
          type: 'jpeg',
          pixelRatio: 2,
          backgroundColor: '${options.export?.backgroundColor || options.backgroundColor || '#ffffff}'});
        downloadUrl(url, filename + '.jpeg');
      } else if (format === 'svg') {
        const url = chart.getOption().toolbox?.feature?.saveAsImage?.title?.svg;
        const svgStr = chart.getDom().querySelector('svg').outerHTML;
        const blob = new Blob([svgStr], {type: 'image/svg+xml'});
        const urlObj = URL.createObjectURL(blob);
        downloadUrl(urlObj, filename + '.svg');
        URL.revokeObjectURL(urlObj);
      } else if (format === 'pdf') {
        alert('PDF导出功能需要额外的jsPDF库支持');
      }
    }
    
    function downloadUrl(url, filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;
    }
    /**
     * 生成SVG输出
     */
    generateSvgOutput(chartData, options) {
        // 这里简化处理，实际应该生成完整的SVG
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.responsive?.width || '800'}" height="${options.responsive?.height || '400'}">
  <rect width="100%" height="100%" fill="${options.backgroundColor || '#ffffff'}"/>
  <text x="50%" y="20" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">${options.title || 'CSV数据可视化'}</text>
  <text x="50%" y="40" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">SVG输出 (此为示例，实际应生成完整图表)</text>
  <text x="10" y="60" font-family="Arial" font-size="12" fill="#666">图表类型: ${this.getChartTypeName(options.chartType)}</text>
  <text x="10" y="80" font-family="Arial" font-size="12" fill="#666">数据点数: ${chartData.series?.[0]?.data?.length || 0}</text>
</svg>`;
    }
    /**
     * 生成坐标轴配置
     */
    generateAxisConfig(axisType, axisConfig) {
        if (!axisConfig?.show)
            return `${axisType}: { show: false }`;
        return `${axisType}: {
      show: true,
      type: '${axisConfig.type || (axisType === 'xAxis' ? 'category' : 'value')}',
      name: '${axisConfig.title || ''}',
      axisLine: { show: true },
      axisTick: { show: true },
      axisLabel: { show: true },
      splitLine: { show: ${axisConfig.grid || false} },
      min: ${axisConfig.min !== undefined ? axisConfig.min : 'null'},
      max: ${axisConfig.max !== undefined ? axisConfig.max : 'null'},
      position: '${axisConfig.position || (axisType === 'xAxis' ? 'bottom' : 'left')}'
    }`;
    }
    /**
     * 获取图表类型名称
     */
    getChartTypeName(chartType) {
        const typeMap = {
            'bar': '柱状图',
            'line': '折线图',
            'pie': '饼图',
            'scatter': '散点图',
            'histogram': '直方图',
            'box': '箱线图',
            'area': '面积图',
            'radar': '雷达图',
            'heatmap': '热力图'
        };
        return typeMap[chartType] || chartType;
    }
    /**
     * 获取ECharts主题
     */
    getEChartsTheme(theme) {
        const themeMap = {
            'light': 'light',
            'dark': 'dark',
            'default': '',
            'pastel': '',
            'vintage': '',
            'modern': ''
        };
        return themeMap[theme || 'default'];
    }
}
exports.CsvDataVisualizer = CsvDataVisualizer;
//# sourceMappingURL=CsvDataVisualizer.js.map