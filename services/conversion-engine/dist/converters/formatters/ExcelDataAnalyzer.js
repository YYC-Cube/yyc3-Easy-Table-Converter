"use strict";
/**
 * @file Excel数据分析器
 * @description 对Excel文件数据进行高级分析、统计和可视化准备
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelDataAnalyzer = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Excel数据分析器类
 */
class ExcelDataAnalyzer extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel数据分析器', '对Excel文件数据进行高级分析、统计和可视化准备', ['xlsx', 'xls', 'xlsm'], ['json', 'markdown', 'html']);
    }
    /**
     * 执行Excel数据分析
     * @param inputData Excel输入数据
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
                    sheets: [],
                    columns: [],
                    sampleSize: 1000,
                    maxRows: 100000,
                    startRow: 0,
                    headerRow: 0,
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
                    analyzeFormulas: false,
                    analyzeConditionalFormats: false,
                    analyzeDataValidation: false,
                    trimValues: true,
                    convertEmptyToNull: true,
                    detectDataTypes: true,
                    ...options.analysisConfig
                },
                // 输出选项
                outputFormat: outputFormat || 'json',
                includeRawData: options.includeRawData ?? false,
                includeSummary: options.includeSummary ?? true,
                includeSheetDetails: options.includeSheetDetails ?? true,
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
                return this.analyzeExcelData(inputData, analysisOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(analysisData, outputFormat, inputFormat, {
                size: Buffer.byteLength(analysisData),
                sheetsAnalyzed: analysisData.summary?.totalSheets || 0,
                totalRows: analysisData.summary?.totalRows || 0,
                totalColumns: analysisData.summary?.totalColumns || 0,
                processingTime: duration,
                qualityIssuesFound: analysisData.qualityIssues?.length || 0,
                insightsGenerated: analysisData.insights?.length || 0
            });
        }
        catch (error) {
            logger_1.logger.error('Excel数据分析失败:', error);
            return this.createErrorResult(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 分析Excel数据
     * @param inputData Excel输入数据
     * @param options 分析选项
     */
    analyzeExcelData(inputData, options) {
        try {
            // 在实际实现中，这里会使用xlsx库解析Excel文件
            // 由于我们在模拟环境中，这里创建一个模拟的分析结果
            // 模拟的工作表数据
            const mockSheetData = {
                'Sheet1': {
                    name: 'Sheet1',
                    rowCount: 1000,
                    columnCount: 20,
                    headers: ['ID', '姓名', '年龄', '薪资', '入职日期', '部门', '绩效评分', '是否全职', '籍贯', '联系方式'],
                    // 其他模拟数据...
                },
                'Sheet2': {
                    name: 'Sheet2',
                    rowCount: 500,
                    columnCount: 15,
                    headers: ['项目ID', '项目名称', '负责人', '开始日期', '结束日期', '预算', '实际支出', '状态', '优先级', '备注'],
                    // 其他模拟数据...
                }
            };
            // 分析工作表
            const sheetResults = {};
            const overallQualityIssues = [];
            const overallInsights = [];
            for (const [sheetName, sheetData] of Object.entries(mockSheetData)) {
                const analysisResult = this.analyzeSheet(sheetData, options.analysisConfig);
                sheetResults[sheetName] = analysisResult;
                overallQualityIssues.push(...analysisResult.qualityIssues);
                overallInsights.push(...analysisResult.insights);
            }
            // 构建输出数据
            const outputData = this.buildOutputData(sheetResults, overallQualityIssues, overallInsights, options);
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
            logger_1.logger.error('Excel数据分析错误:', error);
            throw error;
        }
    }
    /**
     * 分析单个工作表
     */
    analyzeSheet(sheetData, config) {
        // 模拟工作表分析逻辑
        const sheetResult = {
            name: sheetData.name,
            rowCount: sheetData.rowCount,
            columnCount: sheetData.columnCount,
            headers: sheetData.headers,
            columnStatistics: {},
            qualityIssues: [],
            insights: [],
            visualizations: []
        };
        // 模拟列统计信息
        if (sheetData.headers) {
            for (const header of sheetData.headers.slice(0, 5)) { // 只模拟前5列
                sheetResult.columnStatistics[header] = this.generateMockStatistics(header);
            }
        }
        // 模拟数据质量问题
        sheetResult.qualityIssues = [
            {
                sheet: sheetData.name,
                column: '联系方式',
                type: 'missing_values',
                severity: 'medium',
                count: 25,
                description: '存在2.5%的缺失值',
                recommendation: '补充缺失的联系方式信息'
            },
            {
                sheet: sheetData.name,
                column: 'ID',
                type: 'duplicate_values',
                severity: 'high',
                count: 3,
                description: 'ID列存在重复值',
                recommendation: '确保ID的唯一性'
            }
        ];
        // 模拟数据洞察
        sheetResult.insights = [
            {
                type: 'pattern',
                description: `工作表 ${sheetData.name} 中的数据分布合理，主要集中在预期范围内`,
                confidence: 0.95,
                relatedSheets: [sheetData.name]
            }
        ];
        // 模拟公式统计（如果启用）
        if (config.analyzeFormulas) {
            sheetResult.formulaStats = {
                totalFormulas: 45,
                uniqueFormulas: 12,
                formulaErrors: 2,
                formulaTypes: {
                    'SUM': 15,
                    'AVERAGE': 8,
                    'COUNT': 5,
                    'IF': 12,
                    'VLOOKUP': 5
                }
            };
        }
        return sheetResult;
    }
    /**
     * 生成模拟统计数据
     */
    generateMockStatistics(columnName) {
        const baseCount = 1000;
        const nullCount = Math.floor(Math.random() * 50);
        // 数字列的统计信息
        if (columnName === '年龄' || columnName === '薪资' || columnName === '绩效评分') {
            const min = columnName === '年龄' ? 22 : columnName === '薪资' ? 3000 : 1;
            const max = columnName === '年龄' ? 60 : columnName === '薪资' ? 50000 : 5;
            const mean = columnName === '年龄' ? 35 : columnName === '薪资' ? 15000 : 3.5;
            return {
                count: baseCount,
                nullCount,
                uniqueCount: Math.floor(Math.random() * 100) + 50,
                min,
                max,
                sum: mean * (baseCount - nullCount),
                mean,
                median: mean * 0.95,
                mode: Math.round(mean * 0.9),
                variance: Math.pow(mean * 0.1, 2),
                standardDeviation: mean * 0.1,
                percentiles: {
                    25: mean * 0.7,
                    50: mean * 0.95,
                    75: mean * 1.1,
                    90: mean * 1.2,
                    95: mean * 1.3,
                    99: mean * 1.4
                },
                distribution: {}
            };
        }
        // 非数字列的统计信息
        return {
            count: baseCount,
            nullCount,
            uniqueCount: Math.floor(Math.random() * 200) + 100,
            distribution: {}
        };
    }
    /**
     * 构建输出数据
     */
    buildOutputData(sheetResults, overallQualityIssues, overallInsights, options) {
        // 计算总体统计信息
        let totalRows = 0;
        let totalColumns = 0;
        let analyzedColumns = 0;
        for (const sheetResult of Object.values(sheetResults)) {
            totalRows += sheetResult.rowCount;
            totalColumns += sheetResult.columnCount;
            analyzedColumns += Object.keys(sheetResult.columnStatistics).length;
        }
        const output = {
            metadata: {
                analysisTime: new Date().toISOString(),
                totalSheets: Object.keys(sheetResults).length,
                totalRows,
                totalColumns,
                analyzedColumns,
                configUsed: { ...options.analysisConfig }
            },
            summary: {
                totalSheets: Object.keys(sheetResults).length,
                totalRows,
                totalColumns,
                analyzedColumns,
                qualityIssues: overallQualityIssues.length,
                insights: overallInsights.length,
                formulaStats: this.calculateOverallFormulaStats(sheetResults)
            }
        };
        // 添加详细分析结果
        if (options.includeSheetDetails) {
            output.sheets = sheetResults;
        }
        output.qualityIssues = overallQualityIssues;
        output.insights = overallInsights;
        // 添加数据类型分布
        output.dataTypeDistribution = this.calculateDataTypeDistribution(sheetResults);
        return output;
    }
    /**
     * 计算总体公式统计
     */
    calculateOverallFormulaStats(sheetResults) {
        let totalFormulas = 0;
        let totalFormulaErrors = 0;
        const formulaTypes = {};
        for (const sheetResult of Object.values(sheetResults)) {
            if (sheetResult.formulaStats) {
                totalFormulas += sheetResult.formulaStats.totalFormulas;
                totalFormulaErrors += sheetResult.formulaStats.formulaErrors;
                if (sheetResult.formulaStats.formulaTypes) {
                    for (const [type, count] of Object.entries(sheetResult.formulaStats.formulaTypes)) {
                        formulaTypes[type] = (formulaTypes[type] || 0) + count;
                    }
                }
            }
        }
        return {
            totalFormulas,
            totalFormulaErrors,
            formulaTypes
        };
    }
    /**
     * 计算数据类型分布
     */
    calculateDataTypeDistribution(sheetResults) {
        const distribution = {
            'number': 0,
            'string': 0,
            'date': 0,
            'boolean': 0,
            'unknown': 0
        };
        for (const sheetResult of Object.values(sheetResults)) {
            for (const stats of Object.values(sheetResult.columnStatistics)) {
                if (stats.mean !== undefined) {
                    distribution['number']++;
                }
                else if (stats.min !== undefined && stats.max !== undefined) {
                    distribution['date']++;
                }
                else {
                    // 简单判断，实际应基于更多特征
                    if (Object.keys(stats.distribution || {}).length <= 2) {
                        distribution['boolean']++;
                    }
                    else {
                        distribution['string']++;
                    }
                }
            }
        }
        return distribution;
    }
    /**
     * 生成Markdown报告
     */
    generateMarkdownReport(data) {
        const report = [];
        // 报告标题
        report.push('# Excel数据分析报告');
        report.push(`生成时间: ${new Date(data.metadata.analysisTime).toLocaleString()}`);
        report.push('');
        // 数据摘要
        report.push('## 数据摘要');
        report.push(`- 工作表数: ${data.metadata.totalSheets}`);
        report.push(`- 总行数: ${data.metadata.totalRows}`);
        report.push(`- 总列数: ${data.metadata.totalColumns}`);
        report.push(`- 分析列数: ${data.metadata.analyzedColumns}`);
        report.push('');
        // 工作表概览
        report.push('## 工作表概览');
        report.push('| 工作表名称 | 行数 | 列数 | 分析列数 | 质量问题数 | 洞察数 |');
        report.push('|------------|------|------|----------|------------|--------|');
        if (data.sheets) {
            for (const [sheetName, sheetData] of Object.entries(data.sheets)) {
                report.push(`| ${sheetName} | ${sheetData.rowCount} | ${sheetData.columnCount} | ${Object.keys(sheetData.columnStatistics).length} | ${sheetData.qualityIssues.length} | ${sheetData.insights.length} |`);
            }
        }
        report.push('');
        // 数据质量问题
        if (data.qualityIssues.length > 0) {
            report.push('## 数据质量问题');
            report.push('| 工作表 | 列名 | 问题类型 | 严重程度 | 数量 | 描述 | 建议 |');
            report.push('|--------|------|---------|---------|------|------|------|');
            for (const issue of data.qualityIssues) {
                report.push(`| ${issue.sheet || '-'} | ${issue.column} | ${this.formatIssueType(issue.type)} | ${this.formatSeverity(issue.severity)} | ${issue.count} | ${issue.description} | ${issue.recommendation || '-'}`);
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
                report.push(`- 相关工作表: ${insight.relatedSheets?.join(', ') || '所有'}`);
                report.push(`- 相关列: ${insight.relatedColumns?.join(', ') || '无'}`);
                report.push('');
            }
        }
        // 数据类型分布
        if (data.dataTypeDistribution) {
            report.push('## 数据类型分布');
            report.push('| 数据类型 | 列数 | 占比 |');
            report.push('|----------|------|------|');
            const totalColumns = data.metadata.analyzedColumns;
            for (const [type, count] of Object.entries(data.dataTypeDistribution)) {
                if (count > 0) {
                    const percentage = (count / totalColumns * 100).toFixed(1);
                    report.push(`| ${this.formatDataType(type)} | ${count} | ${percentage}% |`);
                }
            }
            report.push('');
        }
        return report.join('\n');
    }
    /**
     * 生成HTML报告
     */
    generateHtmlReport(data) {
        // 简化的HTML报告生成
        const htmlParts = [];
        htmlParts.push(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Excel数据分析报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f5f5f5; }
    h1, h2, h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; background: white; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3498db; color: white; font-weight: 600; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .severity-high { color: #e74c3c; font-weight: bold; }
    .severity-medium { color: #f39c12; font-weight: bold; }
    .severity-low { color: #27ae60; font-weight: bold; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .stat-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; color: white; }
    .stat-number { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { font-size: 14px; opacity: 0.9; }
    .sheet-tab { margin-bottom: 20px; }
    .sheet-tab button { padding: 10px 20px; margin-right: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .sheet-tab button.active { background: #2980b9; }
    .sheet-content { display: none; }
    .sheet-content.active { display: block; }
    .insight-card { background: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .insight-card h4 { margin-top: 0; color: #2980b9; }
  </style>
</head>
<body>`);
        // 报告标题
        htmlParts.push(`
  <h1>Excel数据分析报告</h1>
  <p>生成时间: ${new Date(data.metadata.analysisTime).toLocaleString()}</p>`);
        // 数据摘要卡片
        htmlParts.push(`
  <div class="card">
    <h2>数据摘要</h2>
    <div class="summary-stats">
      <div class="stat-box">
        <div class="stat-number">${data.metadata.totalSheets}</div>
        <div class="stat-label">工作表数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.metadata.totalRows.toLocaleString()}</div>
        <div class="stat-label">总行数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.metadata.totalColumns.toLocaleString()}</div>
        <div class="stat-label">总列数</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${data.qualityIssues.length}</div>
        <div class="stat-label">质量问题</div>
      </div>
    </div>
  </div>`);
        // 工作表概览
        if (data.sheets) {
            htmlParts.push(`
  <div class="card">
    <h2>工作表概览</h2>
    <table>
      <thead>
        <tr>
          <th>工作表名称</th>
          <th>行数</th>
          <th>列数</th>
          <th>分析列数</th>
          <th>质量问题数</th>
          <th>洞察数</th>
        </tr>
      </thead>
      <tbody>`);
            for (const [sheetName, sheetData] of Object.entries(data.sheets)) {
                htmlParts.push(`
        <tr>
          <td>${sheetName}</td>
          <td>${sheetData.rowCount.toLocaleString()}</td>
          <td>${sheetData.columnCount}</td>
          <td>${Object.keys(sheetData.columnStatistics).length}</td>
          <td>${sheetData.qualityIssues.length}</td>
          <td>${sheetData.insights.length}</td>
        </tr>`);
            }
            htmlParts.push(`
      </tbody>
    </table>
  </div>`);
        }
        // 数据质量问题
        if (data.qualityIssues.length > 0) {
            htmlParts.push(`
  <div class="card">
    <h2>数据质量问题</h2>
    <table>
      <thead>
        <tr>
          <th>工作表</th>
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
          <td>${issue.sheet || '-'}</td>
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
    <div class="insight-card">
      <h4>${i + 1}. ${this.formatInsightType(insight.type)}: ${insight.description}</h4>
      <p><strong>置信度:</strong> ${(insight.confidence * 100).toFixed(0)}%</p>
      <p><strong>相关工作表:</strong> ${insight.relatedSheets?.join(', ') || '所有'}</p>
      <p><strong>相关列:</strong> ${insight.relatedColumns?.join(', ') || '无'}</p>
    </div>`);
            }
            htmlParts.push(`
  </div>`);
        }
        htmlParts.push(`
  <script>
    // 简单的JavaScript用于工作表标签切换（如果需要）
    document.addEventListener('DOMContentLoaded', function() {
      const tabs = document.querySelectorAll('.sheet-tab button');
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          tabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          
          const contentId = this.getAttribute('data-content');
          document.querySelectorAll('.sheet-content').forEach(content => {
            content.classList.remove('active');
          });
          document.getElementById(contentId).classList.add('active');
        });
      });
    });
  </script>
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
            'inconsistency': '不一致性',
            'formula_error': '公式错误'
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
    /**
     * 格式化数据类型
     */
    formatDataType(type) {
        const typeMap = {
            'number': '数字',
            'string': '文本',
            'date': '日期',
            'boolean': '布尔值',
            'unknown': '未知'
        };
        return typeMap[type] || type;
    }
}
exports.ExcelDataAnalyzer = ExcelDataAnalyzer;
//# sourceMappingURL=ExcelDataAnalyzer.js.map