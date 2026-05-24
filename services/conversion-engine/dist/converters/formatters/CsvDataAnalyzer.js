"use strict";
/**
 * @file CSV数据分析器
 * @description 对CSV文件数据进行高级分析、统计和可视化准备
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvDataAnalyzer = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * CSV数据分析器类
 */
class CsvDataAnalyzer extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV数据分析器', '对CSV文件数据进行高级分析、统计和可视化准备', ['csv'], ['json', 'markdown', 'html']);
    }
    /**
     * 执行CSV数据分析
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 分析选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const analysisOptions = {
                // 分析配置
                analysisConfig: {
                    columns: [],
                    sampleSize: 1000,
                    maxRecords: 100000,
                    performBasicStats: true,
                    performCorrelation: false,
                    performDistribution: false,
                    performOutlierDetection: false,
                    performPatternAnalysis: false,
                    prepareVisualization: false,
                    visualizationTypes: ['bar'],
                    detectDataQualityIssues: true,
                    suggestDataImprovements: true,
                    generateInsights: false,
                    delimiter: ',',
                    quoteChar: '"',
                    hasHeaders: true,
                    encoding: 'utf-8',
                    ...options.analysisConfig
                },
                // 输出选项
                outputFormat: outputFormat || 'json',
                includeRawData: options.includeRawData ?? false,
                includeSummary: options.includeSummary ?? true,
                // 高级选项
                memoryLimit: options.memoryLimit ?? 512,
                parallelProcessing: options.parallelProcessing ?? false,
                // 缓存选项
                useCache: options.useCache ?? false,
                cacheDuration: options.cacheDuration ?? 3600,
                ...options
            };
            // 执行分析并测量性能
            const { result: analysisData, duration } = await this.measurePerformance(() => {
                return this.analyzeCsvData(inputData, analysisOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(analysisData, outputFormat, inputFormat, {
                size: Buffer.byteLength(analysisData),
                columnsAnalyzed: Object.keys(analysisData.columnStatistics || {}).length,
                recordsProcessed: analysisData.metadata?.totalRecords || 0,
                processingTime: duration,
                qualityIssuesFound: analysisData.qualityIssues?.length || 0,
                insightsGenerated: analysisData.insights?.length || 0
            });
        }
        catch (error) {
            logger_1.logger.error('CSV数据分析失败:', error);
            return this.createErrorResult(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 分析CSV数据
     * @param inputData CSV输入数据
     * @param options 分析选项
     */
    analyzeCsvData(inputData, options) {
        try {
            // 转换为字符串
            const csvContent = typeof inputData === 'string' ? inputData : inputData.toString('utf-8');
            // 解析CSV数据
            const { headers, data } = this.parseCsvData(csvContent, options.analysisConfig);
            // 根据分析配置进行分析
            const analysisResults = this.performAnalysis(data, headers, options.analysisConfig);
            // 构建输出数据
            const outputData = this.buildOutputData(data, headers, analysisResults, options);
            // 根据输出格式生成结果
            let result;
            switch (options.outputFormat) {
                case 'markdown':
                    result = this.generateMarkdownReport(outputData);
                    break;
                case 'html':
                    result = this.generateHtmlReport(outputData);
                    break;
                case 'json':
                default:
                    result = JSON.stringify(outputData, null, 2);
            }
            return typeof result === 'string' ? Buffer.from(result) : result;
        }
        catch (error) {
            logger_1.logger.error('CSV数据分析错误:', error);
            throw error;
        }
    }
    /**
     * 解析CSV数据
     */
    parseCsvData(csvContent, config) {
        const { delimiter = ',', quoteChar = '"', hasHeaders = true, maxRecords = 100000 } = config;
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
        // 提取表头
        let headers = [];
        let data = [];
        let startRowIndex = 0;
        if (hasHeaders && lines.length > 0) {
            headers = this.parseCsvLine(lines[0], delimiter, quoteChar);
            startRowIndex = 1;
        }
        else if (!hasHeaders) {
            // 如果没有表头，自动生成列名
            const firstLine = this.parseCsvLine(lines[0], delimiter, quoteChar);
            headers = Array.from({ length: firstLine.length }, (_, i) => `Column_${i + 1}`);
        }
        // 解析数据行
        for (let i = startRowIndex; i < lines.length && i < startRowIndex + maxRecords; i++) {
            const row = this.parseCsvLine(lines[i], delimiter, quoteChar);
            // 确保所有行都有相同数量的列
            if (row.length < headers.length) {
                row.push(...Array(headers.length - row.length).fill(''));
            }
            data.push(row);
        }
        return { headers, data };
    }
    /**
     * 解析单行CSV数据
     */
    parseCsvLine(line, delimiter, quoteChar) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let escaped = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (escaped) {
                current += char;
                escaped = false;
            }
            else if (char === '\\') {
                escaped = true;
            }
            else if (char === quoteChar) {
                inQuotes = !inQuotes;
            }
            else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    /**
     * 执行数据分析
     */
    performAnalysis(data, headers, config) {
        const columnStatistics = {};
        const qualityIssues = [];
        const insights = [];
        const visualizations = [];
        // 获取列配置映射
        const columnConfigMap = new Map();
        if (config.columns) {
            for (const col of config.columns) {
                columnConfigMap.set(col.name, col);
            }
        }
        // 分析每一列
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const columnName = headers[colIndex];
            const columnConfig = columnConfigMap.get(columnName) || {};
            if (columnConfig.includeInAnalysis === false) {
                continue;
            }
            // 获取列数据
            const columnData = data.map(row => row[colIndex]);
            // 确定数据类型
            const dataType = columnConfig.type || this.detectDataType(columnData);
            // 执行基本统计分析
            if (config.performBasicStats) {
                columnStatistics[columnName] = this.calculateStatistics(columnData, dataType, columnConfig);
            }
            // 检测数据质量问题
            if (config.detectDataQualityIssues) {
                const issues = this.detectDataQuality(columnData, columnName, dataType);
                qualityIssues.push(...issues);
            }
        }
        // 执行相关性分析
        if (config.performCorrelation && headers.length > 1) {
            this.performCorrelationAnalysis(data, headers, columnStatistics, config);
        }
        // 生成洞察
        if (config.generateInsights) {
            insights.push(...this.generateInsights(data, headers, columnStatistics, qualityIssues));
        }
        // 准备可视化数据
        if (config.prepareVisualization && config.visualizationTypes) {
            for (const vizType of config.visualizationTypes) {
                const vizData = this.prepareVisualizationData(data, headers, columnStatistics, vizType);
                if (vizData) {
                    visualizations.push(vizData);
                }
            }
        }
        // 构建元数据
        const metadata = {
            totalRecords: data.length,
            totalColumns: headers.length,
            analyzedColumns: Object.keys(columnStatistics).length,
            analysisTime: new Date().toISOString(),
            sampleSize: Math.min(data.length, config.sampleSize || 1000),
            configUsed: { ...config }
        };
        return {
            columnStatistics,
            qualityIssues,
            insights,
            visualizations,
            metadata
        };
    }
    /**
     * 检测数据类型
     */
    detectDataType(columnData) {
        const sample = columnData.slice(0, 100); // 采样前100条数据
        // 尝试检测数字类型
        let numericCount = 0;
        let booleanCount = 0;
        let dateCount = 0;
        for (const value of sample) {
            if (value === null || value === undefined || value === '') {
                continue;
            }
            // 检查布尔值
            const lowerValue = String(value).toLowerCase();
            if (lowerValue === 'true' || lowerValue === 'false' || value === true || value === false) {
                booleanCount++;
                continue;
            }
            // 检查数字
            if (!isNaN(Number(value)) && Number.isFinite(Number(value))) {
                numericCount++;
                continue;
            }
            // 检查日期
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                dateCount++;
                continue;
            }
        }
        // 根据多数决定类型
        const nonEmptyCount = sample.filter(v => v !== null && v !== undefined && v !== '').length;
        const threshold = 0.7; // 70%以上的数据符合该类型
        if (nonEmptyCount > 0) {
            if (booleanCount / nonEmptyCount >= threshold)
                return 'boolean';
            if (numericCount / nonEmptyCount >= threshold)
                return 'number';
            if (dateCount / nonEmptyCount >= threshold)
                return 'date';
        }
        return 'string';
    }
    /**
     * 计算统计数据
     */
    calculateStatistics(columnData, dataType, columnConfig) {
        const result = {
            count: columnData.length,
            nullCount: columnData.filter(v => v === null || v === undefined || v === '').length
        };
        // 过滤空值
        const validData = columnData.filter(v => v !== null && v !== undefined && v !== '');
        if (validData.length === 0) {
            return result;
        }
        // 计算唯一值
        const uniqueValues = new Set(validData.map(String));
        result.uniqueCount = uniqueValues.size;
        // 根据数据类型计算特定统计量
        if (dataType === 'number') {
            const numericData = validData.map(v => Number(v));
            result.min = Math.min(...numericData);
            result.max = Math.max(...numericData);
            result.sum = numericData.reduce((a, b) => a + b, 0);
            result.mean = result.sum / numericData.length;
            // 排序用于中位数和百分位数
            const sorted = [...numericData].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            result.median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
            // 计算方差和标准差
            const squaredDiffs = sorted.map(val => Math.pow(val - result.mean, 2));
            result.variance = squaredDiffs.reduce((a, b) => a + b, 0) / sorted.length;
            result.standardDeviation = Math.sqrt(result.variance);
            // 计算主要百分位数
            result.percentiles = {
                25: sorted[Math.floor(sorted.length * 0.25)],
                50: result.median,
                75: sorted[Math.floor(sorted.length * 0.75)],
                90: sorted[Math.floor(sorted.length * 0.90)],
                95: sorted[Math.floor(sorted.length * 0.95)],
                99: sorted[Math.floor(sorted.length * 0.99)]
            };
        }
        else if (dataType === 'date') {
            const dateData = validData.map(v => new Date(v).getTime());
            result.min = Math.min(...dateData);
            result.max = Math.max(...dateData);
        }
        // 计算分布（适用于所有类型）
        result.distribution = {};
        for (const value of validData) {
            const key = String(value);
            result.distribution[key] = (result.distribution[key] || 0) + 1;
        }
        // 找出众数
        const maxCount = Math.max(...Object.values(result.distribution));
        const modes = Object.entries(result.distribution)
            .filter(([_, count]) => count === maxCount)
            .map(([value]) => value);
        result.mode = modes.length === 1 ? modes[0] : modes;
        return result;
    }
    /**
     * 检测数据质量问题
     */
    detectDataQuality(columnData, columnName, dataType) {
        const issues = [];
        const validData = columnData.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = columnData.length - validData.length;
        // 检查缺失值
        if (nullCount > 0) {
            const missingPercentage = (nullCount / columnData.length) * 100;
            let severity = 'low';
            if (missingPercentage > 30)
                severity = 'high';
            else if (missingPercentage > 10)
                severity = 'medium';
            issues.push({
                column: columnName,
                type: 'missing_values',
                severity,
                count: nullCount,
                description: `存在 ${missingPercentage.toFixed(2)}% 的缺失值`,
                recommendation: severity === 'high'
                    ? '考虑填充缺失值或调查数据收集过程'
                    : '少量缺失值可能在可接受范围内'
            });
        }
        // 检查数据类型一致性
        if (dataType === 'number') {
            const invalidNumericCount = validData.filter(v => isNaN(Number(v))).length;
            if (invalidNumericCount > 0) {
                issues.push({
                    column: columnName,
                    type: 'invalid_format',
                    severity: 'medium',
                    count: invalidNumericCount,
                    description: '存在非数字值',
                    recommendation: '检查并修复格式错误的数据'
                });
            }
        }
        // 检查重复值（适用于键列）
        if (columnName.toLowerCase().includes('id')) {
            const uniqueValues = new Set(validData.map(String));
            const duplicateCount = validData.length - uniqueValues.size;
            if (duplicateCount > 0) {
                issues.push({
                    column: columnName,
                    type: 'duplicate_values',
                    severity: 'high',
                    count: duplicateCount,
                    description: 'ID列中存在重复值',
                    recommendation: '确保ID列中的值唯一'
                });
            }
        }
        return issues;
    }
    /**
     * 执行相关性分析
     */
    performCorrelationAnalysis(data, headers, columnStatistics, config) {
        // 找出所有数字列
        const numericColumns = [];
        for (const [columnName, stats] of Object.entries(columnStatistics)) {
            if (stats.mean !== undefined) { // 数字列会有mean值
                numericColumns.push(columnName);
            }
        }
        if (numericColumns.length < 2) {
            return; // 至少需要两列进行相关性分析
        }
        // 计算列之间的相关性
        for (let i = 0; i < numericColumns.length; i++) {
            const column1 = numericColumns[i];
            const column1Index = headers.indexOf(column1);
            if (!columnStatistics[column1].correlation) {
                columnStatistics[column1].correlation = {};
            }
            for (let j = i + 1; j < numericColumns.length; j++) {
                const column2 = numericColumns[j];
                const column2Index = headers.indexOf(column2);
                // 计算皮尔逊相关系数
                const correlation = this.calculatePearsonCorrelation(data.map(row => Number(row[column1Index])), data.map(row => Number(row[column2Index])));
                // 更新两个列的相关性
                columnStatistics[column1].correlation[column2] = correlation;
                if (!columnStatistics[column2].correlation) {
                    columnStatistics[column2].correlation = {};
                }
                columnStatistics[column2].correlation[column1] = correlation;
            }
        }
    }
    /**
     * 计算皮尔逊相关系数
     */
    calculatePearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            if (!isNaN(x[i]) && !isNaN(y[i])) {
                sumX += x[i];
                sumY += y[i];
                sumXY += x[i] * y[i];
                sumX2 += x[i] * x[i];
                sumY2 += y[i] * y[i];
            }
        }
        const numerator = sumXY - (sumX * sumY / n);
        const denominator = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    /**
     * 生成数据洞察
     */
    generateInsights(data, headers, columnStatistics, qualityIssues) {
        const insights = [];
        // 基于统计数据生成洞察
        for (const [columnName, stats] of Object.entries(columnStatistics)) {
            // 检测高度集中的值（低多样性）
            if (stats.uniqueCount && stats.count && stats.uniqueCount / stats.count < 0.05) {
                insights.push({
                    type: 'pattern',
                    description: `列 ${columnName} 的值高度集中，可能是一个标签列或状态列`,
                    confidence: 0.9,
                    relatedColumns: [columnName],
                    evidence: { uniquePercentage: (stats.uniqueCount / stats.count * 100).toFixed(2) }
                });
            }
            // 检测数值列的异常分布
            if (stats.standardDeviation && stats.mean && stats.standardDeviation > stats.mean * 2) {
                insights.push({
                    type: 'anomaly',
                    description: `列 ${columnName} 的数据分布可能存在异常值，标准差远大于平均值`,
                    confidence: 0.85,
                    relatedColumns: [columnName],
                    evidence: { stdDev: stats.standardDeviation, mean: stats.mean }
                });
            }
            // 检测强相关性
            if (stats.correlation) {
                for (const [relatedColumn, correlation] of Object.entries(stats.correlation)) {
                    if (Math.abs(correlation) > 0.8) {
                        insights.push({
                            type: 'correlation',
                            description: `列 ${columnName} 和 ${relatedColumn} 存在强${correlation > 0 ? '正' : '负'}相关关系`,
                            confidence: 0.95,
                            relatedColumns: [columnName, relatedColumn],
                            evidence: { correlationValue: correlation }
                        });
                    }
                }
            }
        }
        // 基于数据质量问题生成改进建议
        if (qualityIssues.length > 0) {
            const highSeverityIssues = qualityIssues.filter(issue => issue.severity === 'high');
            if (highSeverityIssues.length > 0) {
                insights.push({
                    type: 'recommendation',
                    description: `发现 ${highSeverityIssues.length} 个严重数据质量问题，建议优先处理`,
                    confidence: 1.0,
                    relatedColumns: [...new Set(highSeverityIssues.map(issue => issue.column))]
                });
            }
        }
        return insights;
    }
    /**
     * 准备可视化数据
     */
    prepareVisualizationData(data, headers, columnStatistics, visualizationType) {
        // 为了简化，这里只实现了柱状图的示例
        if (visualizationType !== 'bar') {
            return null;
        }
        // 找出第一个有分布数据的列
        for (const [columnName, stats] of Object.entries(columnStatistics)) {
            if (stats.distribution) {
                const distribution = stats.distribution;
                // 限制显示的类别数量
                const sortedCategories = Object.entries(distribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10);
                return {
                    type: 'bar',
                    title: `${columnName} 分布`,
                    xAxis: {
                        name: columnName,
                        data: sortedCategories.map(([category]) => category)
                    },
                    yAxis: {
                        name: '频率',
                        data: sortedCategories.map(([, count]) => count)
                    },
                    metadata: {
                        totalCategories: Object.keys(distribution).length,
                        displayedCategories: Math.min(10, Object.keys(distribution).length)
                    }
                };
            }
        }
        return null;
    }
    /**
     * 构建输出数据
     */
    buildOutputData(data, headers, analysisResults, options) {
        const output = {
            metadata: analysisResults.metadata,
            summary: {
                totalRecords: data.length,
                totalColumns: headers.length,
                analyzedColumns: Object.keys(analysisResults.columnStatistics).length,
                qualityIssues: analysisResults.qualityIssues.length,
                insights: analysisResults.insights.length
            }
        };
        if (options.includeSummary) {
            output.summary = {
                ...output.summary,
                dataTypes: Object.entries(analysisResults.columnStatistics)
                    .map(([name, stats]) => ({
                    column: name,
                    type: stats.mean !== undefined ? 'number' : stats.min && stats.max ? 'date' : 'string'
                }))
            };
        }
        // 添加详细分析结果
        output.columnStatistics = analysisResults.columnStatistics;
        output.qualityIssues = analysisResults.qualityIssues;
        output.insights = analysisResults.insights;
        // 添加可视化数据
        if (analysisResults.visualizations.length > 0) {
            output.visualizations = analysisResults.visualizations;
        }
        // 添加原始数据样本（如果需要）
        if (options.includeRawData) {
            output.sampleData = {
                headers,
                data: data.slice(0, Math.min(10, data.length)) // 只包含前10行作为样本
            };
        }
        return output;
    }
    /**
     * 生成Markdown报告
     */
    generateMarkdownReport(data) {
        const report = [];
        // 报告标题
        report.push('# CSV数据分析报告');
        report.push(`生成时间: ${new Date(data.metadata.analysisTime).toLocaleString()}`);
        report.push('');
        // 数据摘要
        report.push('## 数据摘要');
        report.push(`- 总行数: ${data.metadata.totalRecords}`);
        report.push(`- 总列数: ${data.metadata.totalColumns}`);
        report.push(`- 分析列数: ${data.metadata.analyzedColumns}`);
        report.push('');
        // 数据质量问题
        if (data.qualityIssues.length > 0) {
            report.push('## 数据质量问题');
            report.push('| 列名 | 问题类型 | 严重程度 | 数量 | 描述 | 建议 |');
            report.push('|------|---------|---------|------|------|------|');
            for (const issue of data.qualityIssues) {
                report.push(`| ${issue.column} | ${this.formatIssueType(issue.type)} | ${this.formatSeverity(issue.severity)} | ${issue.count} | ${issue.description} | ${issue.recommendation || '-'}`);
            }
            report.push('');
        }
        // 数据洞察
        if (data.insights.length > 0) {
            report.push('## 数据洞察');
            for (let i = 0; i < data.insights.length; i++) {
                const insight = data.insights[i];
                report.push(`### ${i + 1}. ${this.formatInsightType(insight.type)}: ${insight.description}`);
                report.push(`- 置信度: ${(insight.confidence * 100).toFixed(0)}%`);
                report.push(`- 相关列: ${insight.relatedColumns?.join(', ') || '无'}`);
                report.push('');
            }
        }
        // 列统计信息
        report.push('## 列统计信息');
        for (const [columnName, stats] of Object.entries(data.columnStatistics)) {
            report.push(`### ${columnName}`);
            report.push(`- 计数: ${stats.count}`);
            report.push(`- 空值: ${stats.nullCount}`);
            report.push(`- 唯一值: ${stats.uniqueCount}`);
            if (stats.min !== undefined && stats.max !== undefined) {
                report.push(`- 最小值: ${stats.min}`);
                report.push(`- 最大值: ${stats.max}`);
                report.push(`- 平均值: ${stats.mean?.toFixed(2) || '-'}`);
                report.push(`- 中位数: ${stats.median?.toFixed(2) || '-'}`);
                report.push(`- 标准差: ${stats.standardDeviation?.toFixed(2) || '-'}`);
            }
            report.push('');
        }
        return report.join('\n');
    }
    /**
     * 生成HTML报告
     */
    generateHtmlReport(data) {
        // 这里简化实现，实际项目中应该使用更完整的HTML模板
        const htmlParts = [];
        htmlParts.push(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSV数据分析报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .severity-high { color: #e74c3c; }
    .severity-medium { color: #f39c12; }
    .severity-low { color: #27ae60; }
    .card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .stat-box { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-number { font-size: 28px; font-weight: bold; color: #3498db; }
  </style>
</head>
<body>`);
        // 报告标题
        htmlParts.push(`
  <h1>CSV数据分析报告</h1>
  <p>生成时间: ${new Date(data.metadata.analysisTime).toLocaleString()}</p>`);
        // 数据摘要卡片
        htmlParts.push(`
  <div class="card">
    <h2>数据摘要</h2>
    <div class="summary-stats">
      <div class="stat-box">
        <div class="stat-number">${data.metadata.totalRecords}</div>
        <div>总行数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.metadata.totalColumns}</div>
        <div>总列数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.metadata.analyzedColumns}</div>
        <div>分析列数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.qualityIssues.length}</div>
        <div>质量问题</div>
      </div>
    </div>
  </div>`);
        // 数据质量问题
        if (data.qualityIssues.length > 0) {
            htmlParts.push(`
  <div class="card">
    <h2>数据质量问题</h2>
    <table>
      <thead>
        <tr>
          <th>列名</th>
          <th>问题类型</th>
          <th>严重程度</th>
          <th>数量</th>
          <th>描述</th>
          <th>建议</th>
        </tr>
      </thead>
      <tbody>`);
            for (const issue of data.qualityIssues) {
                htmlParts.push(`
        <tr>
          <td>${issue.column}</td>
          <td>${this.formatIssueType(issue.type)}</td>
          <td class="severity-${issue.severity}">${this.formatSeverity(issue.severity)}</td>
          <td>${issue.count}</td>
          <td>${issue.description}</td>
          <td>${issue.recommendation || '-'}</td>
        </tr>`);
            }
            htmlParts.push(`
      </tbody>
    </table>
  </div>`);
        }
        // 数据洞察
        if (data.insights.length > 0) {
            htmlParts.push(`
  <div class="card">
    <h2>数据洞察</h2>`);
            for (let i = 0; i < data.insights.length; i++) {
                const insight = data.insights[i];
                htmlParts.push(`
    <div style="margin-bottom: 20px;">
      <h3>${i + 1}. ${this.formatInsightType(insight.type)}: ${insight.description}</h3>
      <p>置信度: ${(insight.confidence * 100).toFixed(0)}%</p>
      <p>相关列: ${insight.relatedColumns?.join(', ') || '无'}</p>
    </div>`);
            }
            htmlParts.push(`
  </div>`);
        }
        htmlParts.push(`
</body>
</html>`);
        return htmlParts.join('');
    }
    /**
     * 格式化问题类型
     */
    formatIssueType(type) {
        const typeMap = {
            'missing_values': '缺失值',
            'duplicate_values': '重复值',
            'invalid_format': '格式错误',
            'outliers': '异常值',
            'inconsistency': '不一致性'
        };
        return typeMap[type] || type;
    }
    /**
     * 格式化严重程度
     */
    formatSeverity(severity) {
        const severityMap = {
            'low': '低',
            'medium': '中',
            'high': '高'
        };
        return severityMap[severity] || severity;
    }
    /**
     * 格式化洞察类型
     */
    formatInsightType(type) {
        const typeMap = {
            'trend': '趋势',
            'correlation': '相关性',
            'anomaly': '异常',
            'pattern': '模式',
            'recommendation': '建议'
        };
        return typeMap[type] || type;
    }
}
exports.CsvDataAnalyzer = CsvDataAnalyzer;
//# sourceMappingURL=CsvDataAnalyzer.js.map