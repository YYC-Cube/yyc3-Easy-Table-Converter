"use strict";
/**
 * @file 数据报告生成器
 * @description 根据多格式数据源生成综合性数据报告，支持多种报告模板和输出格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataReportGenerator = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * 数据报告生成器类
 */
class DataReportGenerator extends BaseConverter_1.BaseConverter {
    constructor() {
        super('数据报告生成器', '根据多格式数据源生成综合性数据报告，支持多种报告模板和输出格式', ['csv', 'json', 'xlsx', 'xml', 'html', 'markdown', 'sql', 'api'], ['html', 'pdf', 'docx', 'xlsx', 'pptx', 'json', 'markdown']);
    }
    /**
     * 执行报告生成
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 报告生成选项
     */
    async convert(inputData, inputFormat, outputFormat, options) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const reportOptions = this.setDefaultOptions(options, inputFormat);
            // 验证配置
            this.validateOptions(reportOptions);
            // 记录开始时间
            const startTime = Date.now();
            // 处理单个数据源的情况
            const dataSources = reportOptions.dataSources || [];
            if (dataSources.length === 0) {
                // 如果没有配置数据源，使用输入数据作为默认数据源
                dataSources.push({
                    type: inputFormat,
                    content: inputData,
                    hasHeaders: true,
                    encoding: 'utf-8'
                });
                reportOptions.dataSources = dataSources;
            }
            // 加载和处理数据
            const processedData = await this.loadAndProcessData(dataSources, reportOptions.dataProcessing);
            // 生成报告结构
            const reportStructure = this.generateReportStructure(reportOptions, processedData);
            // 生成报告内容
            const reportContent = this.generateReportContent(reportStructure, processedData, reportOptions, outputFormat);
            // 记录结束时间
            const generationTime = Date.now() - startTime;
            // 创建报告结果元数据
            const reportResult = {
                reportId: `report_${Date.now()}`,
                title: reportOptions.reportTitle || '数据报告',
                type: reportOptions.reportType || 'summary',
                sections: reportStructure.sections?.length || 0,
                charts: reportOptions.charts?.length || 0,
                tables: reportOptions.tables?.length || 0,
                records: processedData.reduce((total, ds) => total + ds.data.length, 0),
                generationTime: generationTime,
                dataSources: dataSources.length,
                metadata: {
                    version: reportOptions.version || '1.0.0',
                    author: reportOptions.author,
                    date: reportOptions.date || new Date().toISOString(),
                    inputFormat: inputFormat,
                    outputFormat: outputFormat,
                    options: {
                        theme: reportOptions.style?.theme,
                        template: reportOptions.style?.template,
                        enableCaching: reportOptions.enableCaching,
                        enableDataValidation: reportOptions.enableDataValidation
                    }
                }
            };
            // 返回成功结果
            return this.createSuccessResult(reportContent, outputFormat, inputFormat, reportResult);
        }
        catch (error) {
            logger_1.logger.error('数据报告生成失败:', error);
            return this.createErrorResult(`报告生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 设置默认选项
     */
    setDefaultOptions(options, inputFormat) {
        // 合并默认选项和用户选项
        return {
            // 报告配置
            reportType: options.reportType || 'summary',
            reportTitle: options.reportTitle || '数据报告',
            reportSubtitle: options.reportSubtitle || '',
            author: options.author || '系统生成',
            company: options.company || '',
            department: options.department || '',
            version: options.version || '1.0.0',
            date: options.date || new Date().toISOString().split('T')[0],
            description: options.description || '',
            keywords: options.keywords || [],
            // 数据源配置
            dataSources: options.dataSources || [],
            // 数据处理配置
            dataProcessing: {
                cleanData: true,
                removeDuplicates: true,
                fillMissing: {
                    enabled: true,
                    strategy: 'mean'
                },
                normalizeData: false,
                limitRows: 10000,
                ...options.dataProcessing
            },
            // 报告结构配置
            reportStructure: {
                toc: {
                    enabled: true,
                    title: '目录',
                    position: 'top',
                    depth: 3,
                    hyperlinks: true,
                    numbering: true
                },
                coverPage: {
                    enabled: true,
                    title: options.reportTitle || '数据报告',
                    subtitle: options.reportSubtitle || '',
                    author: options.author || '系统生成',
                    date: options.date || new Date().toISOString().split('T')[0],
                    layout: 'center'
                },
                footer: {
                    enabled: true,
                    text: '由数据报告生成器自动生成',
                    pageNumbers: true,
                    date: true
                },
                header: {
                    enabled: false
                },
                pageNumbers: {
                    enabled: true,
                    position: 'footer',
                    format: '{page}/{total}',
                    startAt: 1
                },
                ...options.reportStructure
            },
            // 图表配置
            charts: options.charts || [],
            // 表格配置
            tables: options.tables || [],
            // 摘要配置
            summary: {
                metrics: [
                    { field: '_all', label: '记录总数', type: 'count', format: '', color: '#3498db', icon: '📊' },
                    { field: '_all', label: '数据源数', type: 'count', format: '', color: '#2ecc71', icon: '💾' }
                ],
                statistics: true,
                insights: true,
                trends: false,
                ...options.summary
            },
            // 样式配置
            style: {
                theme: options.style?.theme || 'light',
                template: options.style?.template || 'default',
                colors: {
                    primary: '#3498db',
                    secondary: '#2ecc71',
                    background: '#ffffff',
                    text: '#333333',
                    accent: '#e74c3c',
                    ...options.style?.colors
                },
                fonts: {
                    family: 'Arial, sans-serif',
                    ...options.style?.fonts
                },
                margins: {
                    top: '2cm',
                    right: '2cm',
                    bottom: '2cm',
                    left: '2cm',
                    ...options.style?.margins
                },
                responsive: {
                    enabled: true,
                    ...options.style?.responsive
                },
                ...options.style
            },
            // 导出配置
            export: {
                format: options.export?.format || 'html',
                filename: options.export?.filename || `${(options.reportTitle || '数据报告').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
                ...options.export
            },
            // 高级配置
            enableCaching: options.enableCaching !== false,
            enableDataValidation: options.enableDataValidation !== false,
            enableErrorHandling: options.enableErrorHandling !== false,
            enablePerformanceTracking: options.enablePerformanceTracking !== false,
            enableAuditLogging: options.enableAuditLogging !== false,
            customScripts: options.customScripts || {},
            customComponents: options.customComponents || [],
            i18n: {
                locale: 'zh-CN',
                ...options.i18n
            },
            security: options.security || {},
            // 其他继承选项
            ...options
        };
    }
    /**
     * 验证选项
     */
    validateOptions(options) {
        // 验证必需选项
        if (!options.reportTitle) {
            throw new Error('报告标题是必需的');
        }
        // 验证数据源
        const dataSources = options.dataSources || [];
        if (dataSources.length === 0) {
            throw new Error('至少需要一个数据源');
        }
        // 验证数据处理配置
        const dataProcessing = options.dataProcessing;
        if (dataProcessing?.limitRows && dataProcessing.limitRows < 1) {
            throw new Error('限制行数必须大于0');
        }
        // 验证导出格式
        const supportedFormats = ['html', 'pdf', 'docx', 'xlsx', 'pptx', 'json', 'markdown'];
        if (options.export?.format && !supportedFormats.includes(options.export.format)) {
            throw new Error(`不支持的导出格式: ${options.export.format}`);
        }
    }
    /**
     * 加载和处理数据
     */
    async loadAndProcessData(dataSources, dataProcessing) {
        const processedDataSources = [];
        for (const source of dataSources) {
            try {
                // 加载数据（模拟）
                const rawData = this.loadDataFromSource(source);
                // 处理数据
                let processedData = this.processDataSource(rawData, dataProcessing);
                // 应用数据处理配置
                if (dataProcessing) {
                    if (dataProcessing.cleanData) {
                        processedData = this.cleanData(processedData);
                    }
                    if (dataProcessing.removeDuplicates) {
                        processedData = this.removeDuplicates(processedData);
                    }
                    if (dataProcessing.fillMissing?.enabled) {
                        processedData = this.fillMissingValues(processedData, dataProcessing.fillMissing);
                    }
                    if (dataProcessing.normalizeData) {
                        processedData = this.normalizeData(processedData);
                    }
                    if (dataProcessing.filterData && dataProcessing.filterData.length > 0) {
                        processedData = this.filterData(processedData, dataProcessing.filterData);
                    }
                    if (dataProcessing.sortData && dataProcessing.sortData.length > 0) {
                        processedData = this.sortData(processedData, dataProcessing.sortData);
                    }
                    if (dataProcessing.groupData) {
                        processedData = this.groupData(processedData, dataProcessing.groupData);
                    }
                    if (dataProcessing.limitRows !== undefined) {
                        processedData.data = processedData.data.slice(dataProcessing.skipRows || 0, (dataProcessing.skipRows || 0) + dataProcessing.limitRows);
                    }
                    if (dataProcessing.pivotTable?.enabled) {
                        processedData = this.createPivotTable(processedData, dataProcessing.pivotTable);
                    }
                }
                processedDataSources.push({
                    ...processedData,
                    metadata: {
                        sourceType: source.type,
                        sourcePath: source.path || '输入数据',
                        recordCount: processedData.data.length,
                        fields: processedData.headers.length,
                        processingTime: Date.now()
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`数据源处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
                // 在实际实现中，这里可以选择跳过失败的数据源或抛出错误
                throw error;
            }
        }
        return processedDataSources;
    }
    /**
     * 从数据源加载数据
     */
    loadDataFromSource(source) {
        // 根据数据源类型加载数据（模拟）
        switch (source.type) {
            case 'csv':
            case 'json':
            case 'excel':
            case 'xml':
            case 'html':
            case 'markdown':
                // 模拟加载数据
                return this.generateMockData(source);
            case 'api':
                // 模拟API数据
                return this.generateMockApiData();
            case 'database':
                // 模拟数据库数据
                return this.generateMockDatabaseData();
            default:
                throw new Error(`不支持的数据源类型: ${source.type}`);
        }
    }
    /**
     * 生成模拟数据
     */
    generateMockData(source) {
        // 根据不同的数据源类型生成不同的模拟数据
        switch (source.type) {
            case 'csv':
                return {
                    headers: ['id', 'name', 'category', 'amount', 'date', 'status'],
                    data: Array.from({ length: 20 }, (_, i) => ({
                        id: i + 1,
                        name: `产品 ${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) + 1}`,
                        category: ['电子产品', '服装', '食品', '家居', '运动'][i % 5],
                        amount: Math.floor(Math.random() * 10000) + 1000,
                        date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
                        status: ['活跃', '已过期', '暂停', '新建'][i % 4]
                    }))
                };
            case 'json':
                return {
                    headers: ['id', 'title', 'author', 'publishDate', 'pages', 'rating'],
                    data: Array.from({ length: 15 }, (_, i) => ({
                        id: i + 1,
                        title: `图书 ${i + 1} - ${['科幻', '历史', '小说', '技术', '艺术'][i % 5]}题材`,
                        author: `作者 ${String.fromCharCode(65 + i % 10)}`,
                        publishDate: `202${i % 5}-${String((i % 12) + 1).padStart(2, '0')}-01`,
                        pages: Math.floor(Math.random() * 500) + 100,
                        rating: (Math.random() * 5 + 1).toFixed(1)
                    }))
                };
            case 'excel':
                return {
                    headers: ['月份', '销售额', '利润', '客户数', '转化率', '增长率'],
                    data: Array.from({ length: 12 }, (_, i) => ({
                        月份: `${i + 1}月`,
                        销售额: Math.floor(Math.random() * 50000) + 10000,
                        利润: Math.floor(Math.random() * 20000) + 5000,
                        客户数: Math.floor(Math.random() * 1000) + 200,
                        转化率: (Math.random() * 0.6 + 0.2).toFixed(2),
                        增长率: (Math.random() * 0.3 - 0.1).toFixed(2)
                    }))
                };
            case 'xml':
                return {
                    headers: ['employeeId', 'name', 'department', 'position', 'salary', 'hireDate'],
                    data: Array.from({ length: 25 }, (_, i) => ({
                        employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
                        name: `员工 ${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) + 1}`,
                        department: ['技术', '市场', '销售', '财务', '人力资源'][i % 5],
                        position: ['经理', '主管', '专员', '助理', '实习生'][i % 5],
                        salary: Math.floor(Math.random() * 15000) + 5000,
                        hireDate: `20${String(15 + i % 9).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}-15`
                    }))
                };
            case 'html':
                return {
                    headers: ['productId', 'productName', 'price', 'stock', 'brand', 'discount'],
                    data: Array.from({ length: 18 }, (_, i) => ({
                        productId: `P${String(i + 1).padStart(5, '0')}`,
                        productName: `HTML商品 ${i + 1}`,
                        price: Math.floor(Math.random() * 5000) + 100,
                        stock: Math.floor(Math.random() * 200) + 10,
                        brand: [`品牌A`, `品牌B`, `品牌C`, `品牌D`, `品牌E`][i % 5],
                        discount: (Math.random() * 0.5 + 0.5).toFixed(2)
                    }))
                };
            case 'markdown':
                return {
                    headers: ['postId', 'title', 'category', 'tags', 'views', 'comments'],
                    data: Array.from({ length: 12 }, (_, i) => ({
                        postId: i + 1,
                        title: `Markdown文章 ${i + 1}`,
                        category: ['技术', '生活', '旅行', '美食', '读书'][i % 5],
                        tags: [`标签${i + 1}`, `标签${i + 2}`].join(', '),
                        views: Math.floor(Math.random() * 5000) + 100,
                        comments: Math.floor(Math.random() * 100)
                    }))
                };
            default:
                return {
                    headers: ['id', 'value1', 'value2', 'value3'],
                    data: Array.from({ length: 10 }, (_, i) => ({
                        id: i + 1,
                        value1: Math.floor(Math.random() * 100),
                        value2: Math.floor(Math.random() * 200),
                        value3: Math.floor(Math.random() * 150)
                    }))
                };
        }
    }
    /**
     * 生成模拟API数据
     */
    generateMockApiData() {
        return {
            headers: ['userId', 'name', 'email', 'phone', 'address', 'createdAt'],
            data: Array.from({ length: 15 }, (_, i) => ({
                userId: `user_${i + 1}`,
                name: `API用户 ${i + 1}`,
                email: `user${i + 1}@example.com`,
                phone: `1380013800${i}`,
                address: `地址 ${i + 1} 号`,
                createdAt: new Date(Date.now() - i * 86400000).toISOString()
            }))
        };
    }
    /**
     * 生成模拟数据库数据
     */
    generateMockDatabaseData() {
        return {
            headers: ['orderId', 'customerId', 'orderDate', 'totalAmount', 'items', 'paymentMethod', 'status'],
            data: Array.from({ length: 20 }, (_, i) => ({
                orderId: `ORD${String(i + 1).padStart(6, '0')}`,
                customerId: `CUST${String(Math.floor(i / 2) + 1).padStart(5, '0')}`,
                orderDate: `2024-11-${String(i + 1).padStart(2, '0')}`,
                totalAmount: Math.floor(Math.random() * 5000) + 100,
                items: Math.floor(Math.random() * 10) + 1,
                paymentMethod: ['支付宝', '微信支付', '银行卡', '货到付款'][i % 4],
                status: ['待付款', '已付款', '待发货', '已发货', '已完成', '已取消'][i % 6]
            }))
        };
    }
    /**
     * 处理数据源
     */
    processDataSource(rawData, dataProcessing) {
        // 克隆数据以避免修改原始数据
        let processedData = [...rawData.data];
        let processedHeaders = [...rawData.headers];
        // 应用转换操作
        if (dataProcessing?.transformData && dataProcessing.transformData.length > 0) {
            for (const transform of dataProcessing.transformData) {
                const fieldIndex = processedHeaders.indexOf(transform.field);
                if (fieldIndex !== -1) {
                    processedData = processedData.map(row => {
                        const transformedRow = { ...row };
                        const value = transformedRow[transform.field];
                        switch (transform.operation) {
                            case 'uppercase':
                                transformedRow[transform.field] = String(value).toUpperCase();
                                break;
                            case 'lowercase':
                                transformedRow[transform.field] = String(value).toLowerCase();
                                break;
                            case 'trim':
                                transformedRow[transform.field] = String(value).trim();
                                break;
                            case 'substring':
                                if (transform.params && typeof transform.params.start !== 'undefined') {
                                    transformedRow[transform.field] = String(value).substring(transform.params.start, transform.params.end);
                                }
                                break;
                            case 'replace':
                                if (transform.params && transform.params.search && transform.params.replace) {
                                    transformedRow[transform.field] = String(value).replace(new RegExp(transform.params.search, 'g'), transform.params.replace);
                                }
                                break;
                            case 'round':
                                transformedRow[transform.field] = Math.round(parseFloat(value) || 0);
                                break;
                            case 'floor':
                                transformedRow[transform.field] = Math.floor(parseFloat(value) || 0);
                                break;
                            case 'ceil':
                                transformedRow[transform.field] = Math.ceil(parseFloat(value) || 0);
                                break;
                            case 'custom':
                                // 在实际实现中，这里可以执行自定义函数
                                break;
                        }
                        return transformedRow;
                    });
                }
            }
        }
        return { data: processedData, headers: processedHeaders };
    }
    /**
     * 清理数据
     */
    cleanData(data) {
        const cleanedData = data.data.map(row => {
            const cleanedRow = {};
            data.headers.forEach(header => {
                let value = row[header];
                // 清理值
                if (typeof value === 'string') {
                    value = value.trim();
                    // 移除多余的空格
                    value = value.replace(/\s+/g, ' ');
                    // 空字符串转为null
                    if (value === '') {
                        value = null;
                    }
                }
                else if (value === undefined || value === '') {
                    value = null;
                }
                cleanedRow[header] = value;
            });
            return cleanedRow;
        });
        return { ...data, data: cleanedData };
    }
    /**
     * 移除重复项
     */
    removeDuplicates(data) {
        const seen = new Set();
        const uniqueData = data.data.filter(row => {
            // 创建一个唯一键
            const key = JSON.stringify(Object.keys(row).sort().map(k => row[k]));
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
        return { ...data, data: uniqueData };
    }
    /**
     * 填充缺失值
     */
    fillMissingValues(data, fillConfig) {
        const filledData = [...data.data];
        const { strategy, value } = fillConfig;
        // 计算每列的统计信息
        const columnStats = {};
        data.headers.forEach(header => {
            columnStats[header] = { sum: 0, count: 0, values: [] };
        });
        // 统计数据
        filledData.forEach(row => {
            data.headers.forEach(header => {
                const val = row[header];
                if (val !== null && val !== undefined && !isNaN(parseFloat(val))) {
                    const numVal = parseFloat(val);
                    columnStats[header].sum += numVal;
                    columnStats[header].count++;
                    columnStats[header].values.push(numVal);
                }
            });
        });
        // 填充缺失值
        return {
            ...data,
            data: filledData.map(row => {
                const filledRow = { ...row };
                data.headers.forEach(header => {
                    if (filledRow[header] === null || filledRow[header] === undefined || filledRow[header] === '') {
                        switch (strategy) {
                            case 'mean':
                                if (columnStats[header].count > 0) {
                                    filledRow[header] = columnStats[header].sum / columnStats[header].count;
                                }
                                else {
                                    filledRow[header] = 0;
                                }
                                break;
                            case 'median':
                                if (columnStats[header].values.length > 0) {
                                    const sorted = [...columnStats[header].values].sort((a, b) => a - b);
                                    const mid = Math.floor(sorted.length / 2);
                                    filledRow[header] = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                                }
                                else {
                                    filledRow[header] = 0;
                                }
                                break;
                            case 'mode':
                                // 简单的众数计算
                                if (columnStats[header].values.length > 0) {
                                    const counts = {};
                                    columnStats[header].values.forEach(v => {
                                        counts[v] = (counts[v] || 0) + 1;
                                    });
                                    let maxCount = 0;
                                    let modeValue = 0;
                                    Object.entries(counts).forEach(([val, count]) => {
                                        if (count > maxCount) {
                                            maxCount = count;
                                            modeValue = parseFloat(val);
                                        }
                                    });
                                    filledRow[header] = modeValue;
                                }
                                else {
                                    filledRow[header] = 0;
                                }
                                break;
                            case 'zero':
                                filledRow[header] = 0;
                                break;
                            case 'custom':
                                filledRow[header] = value !== undefined ? value : null;
                                break;
                            default:
                                filledRow[header] = 0;
                        }
                    }
                });
                return filledRow;
            })
        };
    }
    /**
     * 标准化数据
     */
    normalizeData(data) {
        // 计算每列的最小值和最大值
        const columnStats = {};
        data.headers.forEach(header => {
            columnStats[header] = { min: Infinity, max: -Infinity };
        });
        // 找出最小值和最大值
        data.data.forEach(row => {
            data.headers.forEach(header => {
                const val = parseFloat(row[header]);
                if (!isNaN(val)) {
                    if (val < columnStats[header].min)
                        columnStats[header].min = val;
                    if (val > columnStats[header].max)
                        columnStats[header].max = val;
                }
            });
        });
        // 标准化数据（0-1范围）
        return {
            ...data,
            data: data.data.map(row => {
                const normalizedRow = { ...row };
                data.headers.forEach(header => {
                    const val = parseFloat(normalizedRow[header]);
                    if (!isNaN(val) && columnStats[header].max !== columnStats[header].min) {
                        normalizedRow[header] = (val - columnStats[header].min) / (columnStats[header].max - columnStats[header].min);
                    }
                });
                return normalizedRow;
            })
        };
    }
    /**
     * 过滤数据
     */
    filterData(data, filters) {
        const filteredData = data.data.filter(row => {
            return filters.every(filter => {
                const fieldValue = row[filter.field];
                const filterValue = filter.value;
                switch (filter.operator) {
                    case '=':
                        return fieldValue === filterValue;
                    case '!=':
                        return fieldValue !== filterValue;
                    case '>':
                        return parseFloat(fieldValue) > parseFloat(filterValue);
                    case '<':
                        return parseFloat(fieldValue) < parseFloat(filterValue);
                    case '>=':
                        return parseFloat(fieldValue) >= parseFloat(filterValue);
                    case '<=':
                        return parseFloat(fieldValue) <= parseFloat(filterValue);
                    case 'contains':
                        return String(fieldValue).includes(String(filterValue));
                    case 'not_contains':
                        return !String(fieldValue).includes(String(filterValue));
                    case 'in':
                        return Array.isArray(filterValue) && filterValue.includes(fieldValue);
                    case 'not_in':
                        return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
                    case 'between':
                        if (Array.isArray(filterValue) && filterValue.length === 2) {
                            const numVal = parseFloat(fieldValue);
                            return numVal >= parseFloat(filterValue[0]) && numVal <= parseFloat(filterValue[1]);
                        }
                        return false;
                    case 'starts_with':
                        return String(fieldValue).startsWith(String(filterValue));
                    case 'ends_with':
                        return String(fieldValue).endsWith(String(filterValue));
                    default:
                        return true;
                }
            });
        });
        return { ...data, data: filteredData };
    }
    /**
     * 排序数据
     */
    sortData(data, sortConfig) {
        const sortedData = [...data.data];
        sortedData.sort((a, b) => {
            for (const sort of sortConfig) {
                const fieldA = a[sort.field];
                const fieldB = b[sort.field];
                // 尝试数字比较
                const numA = parseFloat(fieldA);
                const numB = parseFloat(fieldB);
                let comparison = 0;
                if (!isNaN(numA) && !isNaN(numB)) {
                    comparison = numA - numB;
                }
                else {
                    // 字符串比较
                    comparison = String(fieldA).localeCompare(String(fieldB));
                }
                if (comparison !== 0) {
                    return sort.order === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
        return { ...data, data: sortedData };
    }
    /**
     * 分组数据
     */
    groupData(data, groupConfig) {
        const groups = new Map();
        // 分组数据
        data.data.forEach(row => {
            const groupKey = groupConfig.by.map(field => row[field]).join('_');
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(row);
        });
        // 应用聚合
        const aggregatedData = Array.from(groups.entries()).map(([key, rows]) => {
            const groupRow = {};
            // 设置分组字段值
            const groupValues = key.split('_');
            groupConfig.by.forEach((field, index) => {
                groupRow[field] = groupValues[index];
            });
            // 应用聚合函数
            if (groupConfig.aggregations) {
                groupConfig.aggregations.forEach(agg => {
                    const aggregationField = agg.field;
                    const aggregationOperation = agg.operation;
                    const aggregationAlias = agg.alias || `${aggregationOperation}_${aggregationField}`;
                    const values = rows
                        .map(row => parseFloat(row[aggregationField]))
                        .filter(val => !isNaN(val));
                    if (values.length > 0) {
                        switch (aggregationOperation) {
                            case 'sum':
                                groupRow[aggregationAlias] = values.reduce((sum, val) => sum + val, 0);
                                break;
                            case 'avg':
                                groupRow[aggregationAlias] = values.reduce((sum, val) => sum + val, 0) / values.length;
                                break;
                            case 'min':
                                groupRow[aggregationAlias] = Math.min(...values);
                                break;
                            case 'max':
                                groupRow[aggregationAlias] = Math.max(...values);
                                break;
                            case 'count':
                                groupRow[aggregationAlias] = rows.length;
                                break;
                            case 'median':
                                const sorted = [...values].sort((a, b) => a - b);
                                const mid = Math.floor(sorted.length / 2);
                                groupRow[aggregationAlias] = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                                break;
                            case 'mode':
                                // 简单的众数计算
                                const counts = {};
                                values.forEach(v => {
                                    counts[v] = (counts[v] || 0) + 1;
                                });
                                let maxCount = 0;
                                let modeValue = 0;
                                Object.entries(counts).forEach(([val, count]) => {
                                    if (count > maxCount) {
                                        maxCount = count;
                                        modeValue = parseFloat(val);
                                    }
                                });
                                groupRow[aggregationAlias] = modeValue;
                                break;
                            default:
                                groupRow[aggregationAlias] = 0;
                        }
                    }
                    else {
                        groupRow[aggregationAlias] = 0;
                    }
                });
            }
            return groupRow;
        });
        // 生成新的表头
        const newHeaders = [...groupConfig.by];
        if (groupConfig.aggregations) {
            groupConfig.aggregations.forEach(agg => {
                newHeaders.push(agg.alias || `${agg.operation}_${agg.field}`);
            });
        }
        return { data: aggregatedData, headers: newHeaders };
    }
    /**
     * 创建透视表
     */
    createPivotTable(data, pivotConfig) {
        const { rowFields = [], columnFields = [], valueFields = [], aggregation = 'sum' } = pivotConfig;
        if (rowFields.length === 0 || valueFields.length === 0) {
            return data;
        }
        // 创建透视表数据结构
        const pivotData = new Map();
        const columnValues = new Set();
        // 收集列值
        columnFields.forEach(field => {
            data.data.forEach(row => {
                columnValues.add(String(row[field]));
            });
        });
        // 构建透视表数据
        data.data.forEach(row => {
            const rowKey = rowFields.map(field => row[field]).join('_');
            const colKey = columnFields.length > 0 ?
                columnFields.map(field => row[field]).join('_') :
                'default';
            // 确保行存在
            if (!pivotData.has(rowKey)) {
                const newRow = {};
                rowFields.forEach(field => {
                    newRow[field] = row[field];
                });
                pivotData.set(rowKey, newRow);
            }
            const pivotRow = pivotData.get(rowKey);
            // 应用聚合
            valueFields.forEach(valueField => {
                const cellKey = columnFields.length > 0 ?
                    `${colKey}_${valueField}` :
                    valueField;
                const value = parseFloat(row[valueField]) || 0;
                if (pivotRow[cellKey] === undefined) {
                    pivotRow[cellKey] = 0;
                }
                switch (aggregation) {
                    case 'sum':
                        pivotRow[cellKey] += value;
                        break;
                    case 'avg':
                        // 对于平均值，需要跟踪计数
                        if (!pivotRow[`${cellKey}_count`]) {
                            pivotRow[`${cellKey}_count`] = 0;
                        }
                        pivotRow[cellKey] += value;
                        pivotRow[`${cellKey}_count`] += 1;
                        break;
                    case 'count':
                        pivotRow[cellKey] += 1;
                        break;
                    case 'min':
                        pivotRow[cellKey] = Math.min(pivotRow[cellKey], value);
                        break;
                    case 'max':
                        pivotRow[cellKey] = Math.max(pivotRow[cellKey], value);
                        break;
                }
            });
        });
        // 计算平均值
        if (aggregation === 'avg') {
            Array.from(pivotData.values()).forEach(row => {
                valueFields.forEach(valueField => {
                    columnValues.forEach(colVal => {
                        const cellKey = columnFields.length > 0 ?
                            `${colVal}_${valueField}` :
                            valueField;
                        const countKey = `${cellKey}_count`;
                        if (row[countKey]) {
                            row[cellKey] = row[cellKey] / row[countKey];
                            delete row[countKey];
                        }
                    });
                });
            });
        }
        // 生成新的表头
        const newHeaders = [...rowFields];
        if (columnFields.length > 0) {
            columnValues.forEach(colVal => {
                valueFields.forEach(valueField => {
                    newHeaders.push(`${colVal}_${valueField}`);
                });
            });
        }
        else {
            valueFields.forEach(valueField => {
                newHeaders.push(valueField);
            });
        }
        return {
            data: Array.from(pivotData.values()),
            headers: newHeaders
        };
    }
    /**
     * 生成报告结构
     */
    generateReportStructure(options, processedData) {
        // 基础结构
        const structure = { ...options.reportStructure };
        // 如果没有定义章节，自动生成
        if (!structure.sections || structure.sections.length === 0) {
            structure.sections = [];
            // 添加摘要章节
            structure.sections.push({
                id: 'summary',
                title: '数据摘要',
                type: 'summary',
                options: options.summary
            });
            // 为每个数据源添加表格章节
            processedData.forEach((dataSource, index) => {
                structure.sections.push({
                    id: `table_${index}`,
                    title: `数据源 ${index + 1} - 表格视图`,
                    type: 'table',
                    dataSource: index.toString(),
                    options: {
                        ...options.tables?.[index],
                        columns: this.generateTableColumns(dataSource.headers)
                    }
                });
                // 如果数据适合图表，添加图表章节
                if (dataSource.data.length > 0 && dataSource.headers.length > 1) {
                    structure.sections.push({
                        id: `chart_${index}`,
                        title: `数据源 ${index + 1} - 图表分析`,
                        type: 'chart',
                        dataSource: index.toString(),
                        options: this.generateChartConfig(dataSource, index)
                    });
                }
            });
            // 添加详细分析章节
            if (options.reportType === 'detailed' || options.reportType === 'comparison') {
                structure.sections.push({
                    id: 'analysis',
                    title: '详细分析',
                    type: 'text',
                    content: this.generateAnalysisText(processedData, options)
                });
            }
            // 添加结论章节
            structure.sections.push({
                id: 'conclusion',
                title: '结论与建议',
                type: 'text',
                content: this.generateConclusionText(options)
            });
        }
        return structure;
    }
    /**
     * 生成表格列配置
     */
    generateTableColumns(headers) {
        return headers.map(header => ({
            field: header,
            header: header,
            type: this.inferColumnType(header),
            align: this.inferColumnAlign(header),
            visible: true,
            sortable: true
        }));
    }
    /**
     * 推断列类型
     */
    inferColumnType(header) {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('id') || lowerHeader.includes('名称') || lowerHeader.includes('title') || lowerHeader.includes('name')) {
            return 'string';
        }
        else if (lowerHeader.includes('价格') || lowerHeader.includes('金额') || lowerHeader.includes('salary') || lowerHeader.includes('amount')) {
            return 'currency';
        }
        else if (lowerHeader.includes('日期') || lowerHeader.includes('date') || lowerHeader.includes('时间') || lowerHeader.includes('time')) {
            return 'date';
        }
        else if (lowerHeader.includes('率') || lowerHeader.includes('percent') || lowerHeader.includes('ratio') || lowerHeader.includes('rate')) {
            return 'percentage';
        }
        else if (lowerHeader.includes('is') || lowerHeader.includes('status') || lowerHeader.includes('状态')) {
            return 'boolean';
        }
        else {
            return 'number';
        }
    }
    /**
     * 推断列对齐方式
     */
    inferColumnAlign(header) {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('价格') || lowerHeader.includes('金额') || lowerHeader.includes('salary') || lowerHeader.includes('amount') ||
            lowerHeader.includes('率') || lowerHeader.includes('percent') || lowerHeader.includes('ratio')) {
            return 'right';
        }
        else {
            return 'left';
        }
    }
    /**
     * 生成图表配置
     */
    generateChartConfig(dataSource, index) {
        // 根据数据特点选择合适的图表类型
        let chartType = 'bar';
        // 如果数据行数较少，考虑使用饼图
        if (dataSource.data.length <= 10) {
            chartType = 'pie';
        }
        // 如果数据有时间或顺序关系，使用折线图
        else if (dataSource.headers.some(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time') || h.toLowerCase().includes('月份'))) {
            chartType = 'line';
        }
        // 选择合适的X轴字段（通常是第一个非数值字段）
        let xAxisField = dataSource.headers[0];
        for (const header of dataSource.headers) {
            if (this.inferColumnType(header) === 'string') {
                xAxisField = header;
                break;
            }
        }
        // 选择第一个数值字段作为Y轴
        let yAxisField = dataSource.headers.find(h => this.inferColumnType(h) === 'number' ||
            this.inferColumnType(h) === 'currency' ||
            this.inferColumnType(h) === 'percentage') || dataSource.headers[1];
        return {
            type: chartType,
            title: `图表 ${index + 1}`,
            xAxis: {
                field: xAxisField,
                title: xAxisField
            },
            yAxis: {
                field: yAxisField,
                title: yAxisField
            },
            series: [{
                    field
                }]
        };
    }
}
exports.DataReportGenerator = DataReportGenerator;
//# sourceMappingURL=DataReportGenerator.js.map