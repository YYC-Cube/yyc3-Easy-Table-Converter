"use strict";
/**
 * @file Excel数据可视化工具
 * @description 将Excel数据转换为多种可视化图表格式，支持多工作表选择和交互式图表生成
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelDataVisualizer = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Excel数据可视化工具类
 */
class ExcelDataVisualizer extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel数据可视化工具', '将Excel数据转换为多种可视化图表格式，支持多工作表选择和交互式图表生成', ['xlsx', 'xls', 'xlsm'], ['html', 'svg', 'png', 'json', 'xlsx']);
    }
    /**
     * 执行Excel数据可视化
     * @param inputData Excel输入数据
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
                    formats: ['png', 'svg', 'pdf', 'excel'],
                    filename: options.title ? options.title.replace(/\s+/g, '_') : 'chart',
                    ...options.export
                },
                // 数据处理
                dataProcess: {
                    sortOrder: 'asc',
                    pivotTable: {
                        enabled: false
                    },
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
                // Excel解析选项
                excelOptions: {
                    sheet: { sheetIndex: 0, hasHeaders: true },
                    trimValues: true,
                    ...options.excelOptions
                },
                // 高级功能
                enableDrillDown: options.enableDrillDown || false,
                enableDynamicUpdate: options.enableDynamicUpdate || false,
                saveConfig: options.saveConfig || false,
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
                renderEngine: visualOptions.renderEngine,
                worksheetInfo: visualizationData.metadata?.worksheetInfo
            });
        }
        catch (error) {
            logger_1.logger.error('Excel数据可视化失败:', error);
            return this.createErrorResult(`可视化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 创建可视化
     * @param inputData Excel输入数据
     * @param outputFormat 输出格式
     * @param options 可视化选项
     */
    createVisualization(inputData, outputFormat, options) {
        try {
            // 解析Excel数据（模拟）
            const excelData = this.parseExcelData(inputData, options.excelOptions);
            // 处理数据
            const processedData = this.processData(excelData, options.dataProcess);
            // 根据图表类型生成可视化
            const chartData = this.generateChartData(processedData, options);
            // 根据输出格式生成结果
            let result;
            switch (outputFormat) {
                case 'html':
                    result = this.generateHtmlOutput(chartData, options, excelData.metadata);
                    break;
                case 'svg':
                    result = this.generateSvgOutput(chartData, options);
                    break;
                case 'json':
                    result = JSON.stringify({
                        chartType: options.chartType,
                        chartData,
                        options,
                        metadata: excelData.metadata
                    }, null, 2);
                    break;
                case 'png':
                    // 在实际实现中，这里会生成PNG图像
                    result = this.generateHtmlOutput(chartData, options, excelData.metadata); // 模拟，实际应生成PNG
                    break;
                case 'xlsx':
                    // 在实际实现中，这里会生成Excel文件
                    result = JSON.stringify({
                        message: 'Excel输出需要在实际实现中生成'
                    }, null, 2);
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
     * 解析Excel数据
     */
    parseExcelData(inputData, excelOptions) {
        // 模拟Excel解析逻辑
        // 在实际实现中，这里应该使用xlsx库来解析Excel文件
        // 模拟工作表数据
        const mockData = this.generateMockData(excelOptions.sheet?.sheetIndex || 0);
        // 模拟元数据
        const metadata = {
            worksheetInfo: [{
                    name: `Sheet${excelOptions.sheet?.sheetIndex || 0 + 1}`,
                    index: excelOptions.sheet?.sheetIndex || 0,
                    rows: mockData.data.length + (excelOptions.sheet?.hasHeaders || true ? 1 : 0),
                    columns: mockData.headers.length
                }]
        };
        return {
            ...mockData,
            metadata
        };
    }
    /**
     * 生成模拟数据
     */
    generateMockData(sheetIndex) {
        // 根据工作表索引生成不同的模拟数据
        switch (sheetIndex) {
            case 0:
                // 销售数据
                return {
                    headers: ['月份', '销售额', '利润', '客户数', '转化率'],
                    data: [
                        { '月份': '1月', '销售额': 12000, '利润': 3600, '客户数': 120, '转化率': 0.35 },
                        { '月份': '2月', '销售额': 19000, '利润': 5700, '客户数': 180, '转化率': 0.42 },
                        { '月份': '3月', '销售额': 25000, '利润': 7500, '客户数': 220, '转化率': 0.48 },
                        { '月份': '4月', '销售额': 22000, '利润': 6600, '客户数': 200, '转化率': 0.45 },
                        { '月份': '5月', '销售额': 28000, '利润': 8400, '客户数': 250, '转化率': 0.52 },
                        { '月份': '6月', '销售额': 32000, '利润': 9600, '客户数': 280, '转化率': 0.55 }
                    ]
                };
            case 1:
                // 产品数据
                return {
                    headers: ['产品类别', '库存', '销量', '单价', '库存价值'],
                    data: [
                        { '产品类别': '电子产品', '库存': 500, '销量': 230, '单价': 899, '库存价值': 449500 },
                        { '产品类别': '服装', '库存': 1200, '销量': 780, '单价': 129, '库存价值': 154800 },
                        { '产品类别': '食品', '库存': 800, '销量': 560, '单价': 45, '库存价值': 36000 },
                        { '产品类别': '家居', '库存': 300, '销量': 150, '单价': 399, '库存价值': 119700 },
                        { '产品类别': '运动', '库存': 450, '销量': 220, '单价': 199, '库存价值': 89550 }
                    ]
                };
            default:
                // 默认数据
                return {
                    headers: ['日期', '数值1', '数值2', '数值3'],
                    data: Array.from({ length: 10 }, (_, i) => ({
                        '日期': `2024-01-${i + 10}`,
                        '数值1': Math.floor(Math.random() * 1000),
                        '数值2': Math.floor(Math.random() * 2000),
                        '数值3': Math.floor(Math.random() * 1500)
                    }))
                };
        }
    }
    /**
     * 处理数据
     */
    processData(excelData, processConfig) {
        let { headers, data } = excelData;
        // 克隆数据以避免修改原始数据
        let processedData = [...data];
        // 透视表处理
        if (processConfig.pivotTable?.enabled) {
            processedData = this.createPivotTable(processedData, processConfig.pivotTable);
            // 重新生成表头
            headers = Object.keys(processedData[0] || {});
        }
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
            processedData = processedData.filter(row => {
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
        // 数据分组和聚合
        if (processConfig.groupBy && processConfig.groupBy.length > 0 && processConfig.aggregateBy) {
            processedData = this.aggregateData(processedData, processConfig.groupBy, processConfig.aggregateBy, processConfig.aggregateFunction);
            headers = processConfig.groupBy.concat([`${processConfig.aggregateFunction}_${processConfig.aggregateBy}`]);
        }
        // 数据限制
        if (processConfig.limit && processedData.length > processConfig.limit) {
            processedData = processedData.slice(processConfig.offset || 0, (processConfig.offset || 0) + processConfig.limit);
        }
        return { headers, data: processedData };
    }
    /**
     * 创建透视表
     */
    createPivotTable(data, pivotConfig) {
        // 简单的透视表实现
        const { rowFields = [], columnFields = [], valueFields = [], valueFunction = 'sum' } = pivotConfig;
        if (rowFields.length === 0 || valueFields.length === 0) {
            return data;
        }
        const pivotMap = new Map();
        data.forEach(row => {
            const rowKey = rowFields.map(field => row[field]).join('_');
            if (!pivotMap.has(rowKey)) {
                const pivotRow = {};
                rowFields.forEach(field => pivotRow[field] = row[field]);
                // 初始化值字段
                valueFields.forEach(field => pivotRow[`${valueFunction}_${field}`] = 0);
                pivotMap.set(rowKey, pivotRow);
            }
            const pivotRow = pivotMap.get(rowKey);
            valueFields.forEach(field => {
                const value = parseFloat(row[field]) || 0;
                pivotRow[`${valueFunction}_${field}`] += value;
            });
        });
        return Array.from(pivotMap.values());
    }
    /**
     * 聚合数据
     */
    aggregateData(data, groupFields, aggregateField, functionType) {
        const groupMap = new Map();
        data.forEach(row => {
            const groupKey = groupFields.map(field => row[field]).join('_');
            if (!groupMap.has(groupKey)) {
                const groupRow = {};
                groupFields.forEach(field => groupRow[field] = row[field]);
                groupRow.values = [];
                groupMap.set(groupKey, groupRow);
            }
            const groupRow = groupMap.get(groupKey);
            const value = parseFloat(row[aggregateField]) || 0;
            groupRow.values.push(value);
        });
        // 计算聚合值
        return Array.from(groupMap.values()).map(group => {
            let resultValue;
            switch (functionType) {
                case 'sum':
                    resultValue = group.values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'avg':
                    resultValue = group.values.reduce((sum, val) => sum + val, 0) / group.values.length;
                    break;
                case 'min':
                    resultValue = Math.min(...group.values);
                    break;
                case 'max':
                    resultValue = Math.max(...group.values);
                    break;
                case 'count':
                    resultValue = group.values.length;
                    break;
                default:
                    resultValue = group.values.reduce((sum, val) => sum + val, 0);
            }
            delete group.values;
            group[`${functionType}_${aggregateField}`] = resultValue;
            return group;
        });
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
            case 'treemap':
                chartData.series = this.extractTreemapData(data, headers, options);
                break;
            case 'sankey':
                chartData.series = this.extractSankeyData(data, headers, options);
                break;
            case 'graph':
                chartData.series = this.extractGraphData(data, headers, options);
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
                    smooth: series.smooth,
                    emphasis: series.emphasis,
                    label: series.showLabel ? {
                        show: true,
                        position: series.labelPosition,
                        formatter: series.labelFormatter
                    } : undefined
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
        // 应用系列配置
        const seriesConfig = options.series?.[0] || {};
        return [{
                name: seriesConfig.name || '饼图数据',
                type: 'pie',
                data: data.map(row => ({
                    name: row[categoryField],
                    value: parseFloat(row[valueField]) || 0
                })),
                radius: seriesConfig.radius || (options.chartType === 'doughnut' ? ['40%', '70%'] : '50%'),
                roseType: seriesConfig.roseType,
                emphasis: seriesConfig.emphasis,
                label: seriesConfig.showLabel ? {
                    show: true,
                    position: seriesConfig.labelPosition,
                    formatter: seriesConfig.labelFormatter
                } : undefined
            }];
    }
    /**
     * 提取散点图数据
     */
    extractScatterData(data, headers, options) {
        const xField = options.xAxis?.field || headers[1];
        const yField = options.yAxis?.field || headers[2];
        const categoryField = headers[0];
        return [{
                name: '散点数据',
                type: 'scatter',
                data: data.map(row => ([
                    parseFloat(row[xField]) || 0,
                    parseFloat(row[yField]) || 0
                ])),
                symbolSize: options.series?.[0]?.symbolSize || 8
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
                data: bins,
                itemStyle: {
                    color: '#3498db'
                }
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
                name: valueField,
                type: 'boxplot',
                data: [
                    [
                        values[0], // min
                        quartile(0.25), // Q1
                        quartile(0.5), // median
                        quartile(0.75), // Q3
                        values[values.length - 1] // max
                    ]
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
                ])),
                label: {
                    show: true
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }];
    }
    /**
     * 提取树图数据
     */
    extractTreemapData(data, headers, options) {
        const categoryField = options.xAxis?.field || headers[0];
        const valueField = headers.find(header => header !== categoryField) || headers[1];
        return [{
                name: '树图数据',
                type: 'treemap',
                data: data.map(row => ({
                    name: row[categoryField],
                    value: parseFloat(row[valueField]) || 0
                })),
                roam: options.interaction?.zoom,
                label: {
                    show: true
                },
                levels: [
                    {
                        itemStyle: {
                            borderWidth: 0,
                            gapWidth: 5
                        }
                    },
                    {
                        itemStyle: {
                            gapWidth: 1
                        }
                    },
                    {
                        colorSaturation: [0.35, 0.5],
                        itemStyle: {
                            borderColorSaturation: 0.6
                        }
                    }
                ]
            }];
    }
    /**
     * 提取桑基图数据
     */
    extractSankeyData(data, headers, options) {
        // 假设数据格式包含source, target, value字段
        let nodes = new Set();
        let links = [];
        if (headers.includes('source') && headers.includes('target') && headers.includes('value')) {
            data.forEach(row => {
                nodes.add(row.source);
                nodes.add(row.target);
                links.push({
                    source: row.source,
                    target: row.target,
                    value: parseFloat(row.value) || 0
                });
            });
        }
        else {
            // 模拟桑基图数据
            links = this.generateMockSankeyLinks();
            links.forEach(link => {
                nodes.add(link.source);
                nodes.add(link.target);
            });
        }
        return [{
                name: '桑基图数据',
                type: 'sankey',
                left: 50,
                top: 20,
                right: 50,
                bottom: 20,
                data: Array.from(nodes).map(name => ({ name })),
                links: links,
                lineStyle: {
                    color: 'gradient',
                    curveness: 0.5
                }
            }];
    }
    /**
     * 提取关系图数据
     */
    extractGraphData(data, headers, options) {
        // 简单的关系图实现
        const nodes = data.map((row, index) => ({
            id: index,
            name: row[headers[0]],
            value: parseFloat(row[headers[1]]) || 0,
            symbolSize: Math.max(10, Math.min(50, (parseFloat(row[headers[1]]) || 0) / 100))
        }));
        // 生成简单的链接
        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            links.push({
                source: i,
                target: i + 1
            });
        }
        return [{
                name: '关系图数据',
                type: 'graph',
                layout: 'force',
                data: nodes,
                links: links,
                roam: true,
                label: {
                    show: true
                },
                force: {
                    repulsion: 1000,
                    edgeLength: 100
                }
            }];
    }
    /**
     * 生成模拟桑基图链接
     */
    generateMockSankeyLinks() {
        return [
            { source: '源头1', target: '中间1', value: 10 },
            { source: '源头1', target: '中间2', value: 20 },
            { source: '源头2', target: '中间1', value: 15 },
            { source: '源头2', target: '中间3', value: 25 },
            { source: '中间1', target: '目标1', value: 12 },
            { source: '中间1', target: '目标2', value: 13 },
            { source: '中间2', target: '目标2', value: 18 },
            { source: '中间2', target: '目标3', value: 2 },
            { source: '中间3', target: '目标3', value: 25 }
        ];
    }
    /**
     * 生成HTML输出
     */
    generateHtmlOutput(chartData, options, metadata) {
        const width = options.responsive?.width || '100%';
        const height = options.responsive?.height || 400;
        // 生成包含ECharts的HTML
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Excel数据可视化'}</title>
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
    .worksheet-info { margin-top: 10px; padding: 8px; background: #e8f4f8; border-radius: 4px; font-size: 12px; color: #336699; }
    .worksheet-info h4 { margin: 0 0 5px 0; font-size: 13px; }
    .advanced-controls { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; }
    .advanced-controls h4 { margin-top: 0; font-size: 14px; color: #333; }
    .control-group { margin-bottom: 10px; }
    .control-group label { display: inline-block; width: 100px; font-size: 12px; }
    .control-group select, .control-group input { padding: 4px; font-size: 12px; }
    ${options.enableDrillDown ? `
    .drilldown-info { margin-top: 15px; padding: 10px; background: #fff9e6; border-left: 3px solid #f0ad4e; color: #856404; font-size: 12px; }
    ` : ''}
  </style>
</head>
<body>
  <div class="chart-container">
    ${options.title ? `<h2 class="chart-title">${options.title}</h2>` : ''}
    ${options.subtitle ? `<p class="chart-subtitle">${options.subtitle}</p>` : ''}
    ${options.description ? `<p class="chart-description">${options.description}</p>` : ''}
    ${options.enableDrillDown ? `<div class="drilldown-info">💡 提示：您可以点击图表元素进行数据下钻分析</div>` : ''}
    <div id="${options.canvasId}"></div>
    ${options.export?.enabled ? `
    <div class="chart-actions">
      ${options.export?.formats?.includes('png') ? `<button onclick="exportChart('png')">导出PNG</button>` : ''}
      ${options.export?.formats?.includes('jpeg') ? `<button onclick="exportChart('jpeg')">导出JPEG</button>` : ''}
      ${options.export?.formats?.includes('svg') ? `<button onclick="exportChart('svg')">导出SVG</button>` : ''}
      ${options.export?.formats?.includes('pdf') ? `<button onclick="exportChart('pdf')">导出PDF</button>` : ''}
      ${options.export?.formats?.includes('excel') ? `<button onclick="exportChart('excel')">导出Excel</button>` : ''}
    </div>` : ''}
    
    <!-- 高级控制选项 -->
    ${options.enableDynamicUpdate ? `
    <div class="advanced-controls">
      <h4>图表控制</h4>
      <div class="control-group">
        <label>图表类型:</label>
        <select id="chartTypeSelect" onchange="updateChartType(this.value)">
          <option value="bar" ${options.chartType === 'bar' ? 'selected' : ''}>柱状图</option>
          <option value="line" ${options.chartType === 'line' ? 'selected' : ''}>折线图</option>
          <option value="pie" ${options.chartType === 'pie' ? 'selected' : ''}>饼图</option>
          <option value="scatter" ${options.chartType === 'scatter' ? 'selected' : ''}>散点图</option>
        </select>
      </div>
      <div class="control-group">
        <label>主题:</label>
        <select id="themeSelect" onchange="updateChartTheme(this.value)">
          <option value="default" ${options.chartTheme === 'default' ? 'selected' : ''}>默认</option>
          <option value="light" ${options.chartTheme === 'light' ? 'selected' : ''}>浅色</option>
          <option value="dark" ${options.chartTheme === 'dark' ? 'selected' : ''}>深色</option>
        </select>
      </div>
      <div class="control-group">
        <label><input type="checkbox" id="animationCheckbox" ${options.animation?.enabled ? 'checked' : ''} onchange="toggleAnimation(this.checked)"> 启用动画</label>
      </div>
    </div>` : ''}
    
    <div class="chart-info">
      <p>图表类型: ${this.getChartTypeName(options.chartType)}</p>
      <p>数据处理: ${options.dataProcess ? '已应用' : '默认'}</p>
      <p>渲染引擎: ${options.renderEngine}</p>
      ${options.dataProcess?.pivotTable?.enabled ? `<p>透视表: 已启用</p>` : ''}
    </div>
    
    ${metadata?.worksheetInfo ? `
    <div class="worksheet-info">
      <h4>工作表信息</h4>
      ${metadata.worksheetInfo.map((sheet, index) => `
      <p>工作表 ${index + 1}: ${sheet.name} (${sheet.rows}行 × ${sheet.columns}列)</p>
      `).join('')}
    </div>` : ''}
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
    
    // 下钻功能
    ${options.enableDrillDown ? `
    chart.on('click', function(params) {
      alert('下钻分析: ' + params.name + ' (实际实现中会加载更详细的数据)');
      // 在实际实现中，这里会根据点击的数据加载更详细的数据并更新图表
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
      } else if (format === 'excel') {
        alert('Excel导出功能需要在实际后端实现中支持');
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
    
    // 动态更新函数
    ${options.enableDynamicUpdate ? `
    function updateChartType(type) {
      // 在实际实现中，这里会重新生成图表数据并更新配置
      alert('切换图表类型为: ' + type);
      // chart.setOption({ series: [{ type: type }] });
    }
    
    function updateChartTheme(theme) {
      // 在实际实现中，这里会重新初始化图表使用新主题
      alert('切换主题为: ' + theme);
      // chart.dispose();
      // chart = echarts.init(document.getElementById('${options.canvasId}'), theme);
      // chart.setOption(option);
    }
    
    function toggleAnimation(enabled) {
      chart.setOption({ animation: enabled });
    }` : ''}
    
    // 保存配置
    ${options.saveConfig ? `
    function saveChartConfig() {
      const config = chart.getOption();
      localStorage.setItem('chartConfig', JSON.stringify(config));
      alert('图表配置已保存');
    }
    
    function loadChartConfig() {
      const saved = localStorage.getItem('chartConfig');
      if (saved) {
        chart.setOption(JSON.parse(saved));
        alert('图表配置已加载');
      }
    }` : ''}
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
  <text x="50%" y="20" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">${options.title || 'Excel数据可视化'}</text>
  <text x="50%" y="40" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">SVG输出 (此为示例，实际应生成完整图表)</text>
  <text x="10" y="60" font-family="Arial" font-size="12" fill="#666">图表类型: ${this.getChartTypeName(options.chartType)}</text>
  <text x="10" y="80" font-family="Arial" font-size="12" fill="#666">数据点数: ${chartData.series?.[0]?.data?.length || 0}</text>
  <text x="10" y="100" font-family="Arial" font-size="12" fill="#666">Excel源文件: ${options.excelOptions?.sheet?.sheetName || 'Sheet1'}</text>
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
      axisLabel: {
        show: true,
        rotate: ${axisConfig.axisLabel?.rotate || 0}
        ${axisConfig.axisLabel?.formatter ? `,
        formatter: '${axisConfig.axisLabel.formatter}'` : ''}
      },
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
            'heatmap': '热力图',
            'treemap': '树图',
            'sankey': '桑基图',
            'graph': '关系图'
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
            'modern': '',
            'macarons': 'macarons',
            'infographic': 'infographic'
        };
        return themeMap[theme || 'default'];
    }
}
exports.ExcelDataVisualizer = ExcelDataVisualizer;
//# sourceMappingURL=ExcelDataVisualizer.js.map