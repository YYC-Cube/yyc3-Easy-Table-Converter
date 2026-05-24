"use strict";
/**
 * @file HTML到JSON转换器
 * @description 实现HTML文档到JSON数据结构的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * HTML到JSON转换器类
 */
class HtmlToJsonConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('HTML到JSON转换器', '将HTML文档转换为结构化的JSON数据格式', ['html'], ['json', 'js']);
    }
    /**
     * 执行HTML到JSON的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const convertOptions = {
                includeAttributes: options.includeAttributes ?? true,
                includeTextNodes: options.includeTextNodes ?? true,
                includeComments: options.includeComments ?? false,
                includeDoctype: options.includeDoctype ?? false,
                includeHead: options.includeHead ?? true,
                includeHtml: options.includeHtml ?? true,
                normalizeWhitespace: options.normalizeWhitespace ?? true,
                textNodeKey: options.textNodeKey ?? '_text',
                attributePrefix: options.attributePrefix ?? '_',
                rootNodeName: options.rootNodeName ?? 'root',
                ignoreEmptyElements: options.ignoreEmptyElements ?? true,
                ignoreAttributes: options.ignoreAttributes ?? ['data-*'],
                ignoreTags: options.ignoreTags ?? [],
                onlyTags: options.onlyTags ?? [],
                prettyPrint: options.prettyPrint ?? true,
                maxDepth: options.maxDepth ?? 20,
                extractTables: options.extractTables ?? false,
                extractForms: options.extractForms ?? false,
                extractLinks: options.extractLinks ?? false,
                extractImages: options.extractImages ?? false,
                ...options
            };
            // 将Buffer转换为字符串
            let htmlContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 预处理HTML
            htmlContent = this.preprocessHtml(htmlContent, convertOptions);
            // 执行转换并测量性能
            const { result: jsonData, duration } = await this.measurePerformance(() => {
                return this.htmlToJson(htmlContent, convertOptions);
            });
            // 格式化输出
            let output = '';
            if (outputFormat === 'json') {
                output = convertOptions.prettyPrint
                    ? JSON.stringify(jsonData, null, 2)
                    : JSON.stringify(jsonData);
            }
            else if (outputFormat === 'js') {
                output = convertOptions.prettyPrint
                    ? `module.exports = ${JSON.stringify(jsonData, null, 2)};`
                    : `module.exports = ${JSON.stringify(jsonData)};`;
            }
            // 计算统计信息
            const statistics = this.calculateHtmlToJsonStatistics(htmlContent, jsonData);
            // 返回成功结果
            return this.createSuccessResult(output, outputFormat, inputFormat, {
                size: Buffer.byteLength(output),
                elements: statistics.elements,
                attributes: statistics.attributes,
                textNodes: statistics.textNodes,
                comments: statistics.comments,
                jsonObjects: statistics.jsonObjects,
                jsonArrays: statistics.jsonArrays,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('HTML到JSON转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 预处理HTML内容
     */
    preprocessHtml(html, options) {
        let processed = html;
        // 移除DOCTYPE声明
        if (!options.includeDoctype) {
            processed = processed.replace(/<!DOCTYPE[^>]*>/gi, '');
        }
        // 移除头部内容
        if (!options.includeHead) {
            processed = processed.replace(/<head[\s\S]*?<\/head>/gi, '');
        }
        // 移除注释
        if (!options.includeComments) {
            processed = processed.replace(/<!--[\s\S]*?-->/g, '');
        }
        return processed;
    }
    /**
     * HTML转JSON的核心方法
     */
    htmlToJson(html, options) {
        try {
            // 使用正则表达式解析HTML（简化版）
            return this.parseHtmlWithRegex(html, options);
        }
        catch (error) {
            logger_1.logger.warn('标准HTML解析失败，尝试备用方法:', error);
            return this.alternativeHtmlParse(html, options);
        }
    }
    /**
     * 使用正则表达式解析HTML
     */
    parseHtmlWithRegex(html, options, depth = 0) {
        // 检查最大深度
        if (depth >= options.maxDepth) {
            return { [options.textNodeKey]: 'Maximum depth reached' };
        }
        const result = {};
        let currentPos = 0;
        // 查找开始标签
        const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*)>([^<]*)|<!--([\s\S]*?)-->|<\/([a-zA-Z][a-zA-Z0-9]*)>|<!\[CDATA\[([\s\S]*?)\]\]>/g;
        let match;
        let lastTextPos = 0;
        while ((match = tagRegex.exec(html)) !== null) {
            const beforeText = html.substring(lastTextPos, match.index).trim();
            // 处理文本节点
            if (options.includeTextNodes && beforeText) {
                if (options.normalizeWhitespace) {
                    result[options.textNodeKey] = beforeText.replace(/\s+/g, ' ');
                }
                else {
                    result[options.textNodeKey] = beforeText;
                }
            }
            lastTextPos = match.index + match[0].length;
            // 处理注释
            if (match[4]) {
                if (options.includeComments) {
                    result._comment = match[4];
                }
                continue;
            }
            // 处理CDATA
            if (match[6]) {
                if (options.includeTextNodes) {
                    result[options.textNodeKey] = match[6];
                }
                continue;
            }
            // 处理关闭标签
            if (match[5]) {
                const tagName = match[5].toLowerCase();
                // 关闭标签处理在递归中处理
                continue;
            }
            // 处理开始标签
            if (match[1]) {
                const tagName = match[1].toLowerCase();
                const attributesStr = match[2] || '';
                const innerText = match[3] || '';
                // 检查是否忽略标签
                if (options.ignoreTags.includes(tagName)) {
                    continue;
                }
                if (options.onlyTags.length > 0 && !options.onlyTags.includes(tagName)) {
                    continue;
                }
                // 创建标签对象
                const tagObj = {};
                // 解析属性
                if (options.includeAttributes && attributesStr) {
                    const attributes = this.parseAttributes(attributesStr, options);
                    Object.assign(tagObj, attributes);
                }
                // 处理文本内容
                if (options.includeTextNodes && innerText.trim()) {
                    if (options.normalizeWhitespace) {
                        tagObj[options.textNodeKey] = innerText.trim().replace(/\s+/g, ' ');
                    }
                    else {
                        tagObj[options.textNodeKey] = innerText.trim();
                    }
                }
                // 将标签添加到结果中
                if (result[tagName]) {
                    // 如果已存在相同标签名，转为数组
                    if (!Array.isArray(result[tagName])) {
                        result[tagName] = [result[tagName]];
                    }
                    result[tagName].push(tagObj);
                }
                else {
                    result[tagName] = tagObj;
                }
            }
        }
        // 处理最后一段文本
        const remainingText = html.substring(lastTextPos).trim();
        if (options.includeTextNodes && remainingText) {
            if (options.normalizeWhitespace) {
                result[options.textNodeKey] = remainingText.replace(/\s+/g, ' ');
            }
            else {
                result[options.textNodeKey] = remainingText;
            }
        }
        return result;
    }
    /**
     * 解析HTML属性
     */
    parseAttributes(attributesStr, options) {
        const attributes = {};
        const attrRegex = /([a-zA-Z][a-zA-Z0-9:-]*)\s*(?:=\s*(["'])(.*?)\2|=\s*([^\s"'>]+)|(?=[\s>]))/g;
        let match;
        while ((match = attrRegex.exec(attributesStr)) !== null) {
            const attrName = match[1].toLowerCase();
            const attrValue = match[3] || match[4] || '';
            // 检查是否忽略属性
            if (this.shouldIgnoreAttribute(attrName, options.ignoreAttributes)) {
                continue;
            }
            attributes[options.attributePrefix + attrName] = attrValue;
        }
        return attributes;
    }
    /**
     * 检查是否应该忽略属性
     */
    shouldIgnoreAttribute(attrName, ignoreAttributes) {
        for (const pattern of ignoreAttributes) {
            if (pattern === attrName) {
                return true;
            }
            // 处理通配符模式
            if (pattern.endsWith('*') && attrName.startsWith(pattern.slice(0, -1))) {
                return true;
            }
        }
        return false;
    }
    /**
     * 备用的HTML解析方法
     */
    alternativeHtmlParse(html, options) {
        // 更简单的HTML解析逻辑
        const result = {};
        // 提取标题
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        if (titleMatch) {
            result.title = titleMatch[1].trim();
        }
        // 提取段落
        const paragraphs = [];
        const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/gis);
        if (pMatch) {
            pMatch.forEach(p => {
                const text = p.replace(/<[^>]*>/g, '').trim();
                if (text) {
                    paragraphs.push(text);
                }
            });
            if (paragraphs.length > 0) {
                result.paragraphs = paragraphs;
            }
        }
        // 提取链接
        if (options.extractLinks) {
            const links = [];
            const linkMatch = html.match(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis);
            if (linkMatch) {
                linkMatch.forEach(link => {
                    const href = link.match(/href=["']([^"']+)["']/)?.[1];
                    const text = link.replace(/<[^>]*>/g, '').trim();
                    if (href) {
                        links.push({ href, text });
                    }
                });
                if (links.length > 0) {
                    result.links = links;
                }
            }
        }
        // 提取图片
        if (options.extractImages) {
            const images = [];
            const imgMatch = html.match(/<img[^>]*>/gis);
            if (imgMatch) {
                imgMatch.forEach(img => {
                    const src = img.match(/src=["']([^"']+)["']/)?.[1];
                    const alt = img.match(/alt=["']([^"']*)["']/)?.[1] || '';
                    if (src) {
                        images.push({ src, alt });
                    }
                });
                if (images.length > 0) {
                    result.images = images;
                }
            }
        }
        return result;
    }
    /**
     * 计算HTML到JSON转换的统计信息
     */
    calculateHtmlToJsonStatistics(html, jsonData) {
        const elements = (html.match(/<[a-zA-Z][a-zA-Z0-9]*[^>]*>/) || []).length;
        const attributes = (html.match(/[a-zA-Z][a-zA-Z0-9:-]+=["'][^"']*["']/g) || []).length;
        const textNodes = (html.match(/>([^<]+)</g) || []).filter(m => m.replace(/[<>]/g, '').trim()).length;
        const comments = (html.match(/<!--[\s\S]*?-->/g) || []).length;
        // 计算JSON对象和数组数量
        const jsonStats = this.countJsonObjects(jsonData);
        return {
            elements,
            attributes,
            textNodes,
            comments,
            jsonObjects: jsonStats.objects,
            jsonArrays: jsonStats.arrays
        };
    }
    /**
     * 递归计算JSON对象和数组数量
     */
    countJsonObjects(obj) {
        let objects = 0;
        let arrays = 0;
        if (Array.isArray(obj)) {
            arrays++;
            for (const item of obj) {
                if (item && typeof item === 'object') {
                    const stats = this.countJsonObjects(item);
                    objects += stats.objects;
                    arrays += stats.arrays;
                }
            }
        }
        else if (obj && typeof obj === 'object') {
            objects++;
            for (const key in obj) {
                if (obj[key] && typeof obj[key] === 'object') {
                    const stats = this.countJsonObjects(obj[key]);
                    objects += stats.objects;
                    arrays += stats.arrays;
                }
            }
        }
        return { objects, arrays };
    }
}
exports.HtmlToJsonConverter = HtmlToJsonConverter;
//# sourceMappingURL=HtmlToJsonConverter.js.map