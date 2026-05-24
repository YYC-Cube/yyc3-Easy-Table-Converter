"use strict";
/**
 * @file XML格式化工具
 * @description 实现XML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFormatter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * XML格式化工具类
 */
class XmlFormatter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('XML格式化工具', '对XML文件进行格式化、优化和标准化处理', ['xml'], ['xml']);
    }
    /**
     * 执行XML格式化
     * @param inputData XML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const formatOptions = {
                indent: options.indent ?? 2,
                preserveComments: options.preserveComments ?? true,
                removeWhitespace: options.removeWhitespace ?? true,
                normalizeAttributes: options.normalizeAttributes ?? true,
                sortAttributes: options.sortAttributes ?? false,
                compactEmptyElements: options.compactEmptyElements ?? true,
                preserveXmlDeclaration: options.preserveXmlDeclaration ?? true,
                addXmlDeclaration: options.addXmlDeclaration ?? false,
                validate: options.validate ?? true,
                maxLineWidth: options.maxLineWidth ?? 0,
                collapseWhitespace: options.collapseWhitespace ?? false,
                stripComments: options.stripComments ?? false,
                prettyPrint: options.prettyPrint ?? true,
                ...options
            };
            // 将Buffer转换为字符串
            let xmlContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 预处理：移除或保留注释
            if (formatOptions.stripComments) {
                xmlContent = this.removeComments(xmlContent);
            }
            // 验证XML格式
            if (formatOptions.validate && !this.isValidXml(xmlContent)) {
                throw new Error('无效的XML格式');
            }
            // 执行格式化并测量性能
            const { result: formattedXml, duration } = await this.measurePerformance(() => {
                return this.formatXml(xmlContent, formatOptions);
            });
            // 计算统计信息
            const statistics = this.calculateXmlStatistics(formattedXml);
            // 返回成功结果
            return this.createSuccessResult(formattedXml, outputFormat, inputFormat, {
                size: Buffer.byteLength(formattedXml),
                elements: statistics.elements,
                attributes: statistics.attributes,
                comments: statistics.comments,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('XML格式化失败:', error);
            return this.createErrorResult(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 验证XML格式是否有效
     */
    isValidXml(xml) {
        // 简单验证XML格式
        const trimmedXml = xml.trim();
        // 检查是否有基本的XML结构
        const hasXmlDeclaration = /^\s*<\?xml[^>]*>/.test(trimmedXml);
        const hasRootElement = /<[a-zA-Z_][^>]*>.*<\/[a-zA-Z_][^>]*>$/s.test(trimmedXml) ||
            /<[a-zA-Z_][^>]*\/>$/.test(trimmedXml);
        // 检查括号是否匹配
        const openTags = (trimmedXml.match(/<[a-zA-Z_][^>]*[^/]>/g) || []).length;
        const closeTags = (trimmedXml.match(/<\/[a-zA-Z_][^>]*>/g) || []).length;
        const selfClosingTags = (trimmedXml.match(/<[a-zA-Z_][^>]*\/>/g) || []).length;
        return (openTags === closeTags || openTags === closeTags + selfClosingTags) &&
            (hasXmlDeclaration || hasRootElement);
    }
    /**
     * 移除XML注释
     */
    removeComments(xml) {
        return xml.replace(/<!--[\s\S]*?-->/g, '');
    }
    /**
     * 格式化XML内容
     */
    formatXml(xml, options) {
        // 清理多余空白
        if (options.removeWhitespace) {
            xml = this.cleanWhitespace(xml, options.collapseWhitespace);
        }
        // 尝试使用标准格式化
        try {
            return this.prettyPrintXml(xml, options);
        }
        catch (error) {
            logger_1.logger.warn('标准XML格式化失败，尝试备用方法:', error);
            return this.alternativeXmlFormat(xml, options);
        }
    }
    /**
     * 清理XML空白
     */
    cleanWhitespace(xml, collapse) {
        // 保留CDATA中的内容
        const cdataParts = [];
        xml = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (match, offset) => {
            cdataParts.push(match);
            return `__CDATA_PLACEHOLDER_${cdataParts.length - 1}__`;
        });
        // 清理标签间空白
        if (collapse) {
            xml = xml.replace(/>(\s+)</g, '><');
        }
        // 恢复CDATA内容
        cdataParts.forEach((cdata, index) => {
            xml = xml.replace(`__CDATA_PLACEHOLDER_${index}__`, cdata);
        });
        return xml;
    }
    /**
     * 美化XML格式
     */
    prettyPrintXml(xml, options) {
        const indentStr = ' '.repeat(options.indent);
        let formatted = '';
        let indentLevel = 0;
        let inCdata = false;
        let inComment = false;
        let inTag = false;
        let inAttribute = false;
        let lastChar = '';
        let currentTag = '';
        let tagStartIndex = 0;
        for (let i = 0; i < xml.length; i++) {
            const char = xml[i];
            const nextChar = i < xml.length - 1 ? xml[i + 1] : '';
            // 处理CDATA
            if (i + 8 < xml.length && xml.substr(i, 9) === '<![CDATA[') {
                inCdata = true;
                formatted += char;
                lastChar = char;
                continue;
            }
            if (i + 2 < xml.length && xml.substr(i, 3) === ']]>' && inCdata) {
                inCdata = false;
                formatted += char;
                lastChar = char;
                continue;
            }
            // 处理注释
            if (i + 3 < xml.length && xml.substr(i, 4) === '<!--') {
                inComment = true;
                formatted += char;
                lastChar = char;
                continue;
            }
            if (i + 2 < xml.length && xml.substr(i, 3) === '-->') {
                inComment = false;
                formatted += char;
                lastChar = char;
                continue;
            }
            // 在CDATA或注释中直接添加字符
            if (inCdata || inComment) {
                formatted += char;
                lastChar = char;
                continue;
            }
            // 处理标签开始
            if (char === '<' && !inTag && !inCdata && !inComment) {
                inTag = true;
                tagStartIndex = i;
                currentTag = '';
                // 如果不是开始标签或处理指令，添加缩进
                if (nextChar !== '?' && nextChar !== '!' && lastChar !== '') {
                    formatted += '\n' + indentStr.repeat(indentLevel);
                }
            }
            // 收集标签名
            if (inTag && char !== '>' && char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
                currentTag += char;
            }
            // 处理属性
            if (inTag && char === '=' && nextChar === '"' && !inAttribute) {
                inAttribute = true;
            }
            if (inTag && char === '"' && lastChar !== '\\' && inAttribute) {
                inAttribute = false;
            }
            // 处理标签结束
            if (char === '>' && inTag && !inAttribute) {
                inTag = false;
                // 检查是否是自闭合标签
                const tagEnd = xml.substring(tagStartIndex, i + 1);
                const isSelfClosing = tagEnd.endsWith('/>');
                const isClosingTag = currentTag.startsWith('/');
                if (isClosingTag) {
                    // 关闭标签
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                else if (!isSelfClosing && !currentTag.startsWith('?') && !currentTag.startsWith('!')) {
                    // 开始标签，增加缩进
                    indentLevel++;
                }
            }
            formatted += char;
            lastChar = char;
        }
        // 处理XML声明
        formatted = this.processXmlDeclaration(formatted, options);
        return formatted.trim();
    }
    /**
     * 处理XML声明
     */
    processXmlDeclaration(xml, options) {
        const hasDeclaration = /^\s*<\?xml[^>]*>/.test(xml);
        if (!hasDeclaration && options.addXmlDeclaration) {
            // 添加XML声明
            return '<?xml version="1.0" encoding="UTF-8"?>' + xml;
        }
        else if (hasDeclaration && !options.preserveXmlDeclaration) {
            // 移除XML声明
            return xml.replace(/^\s*<\?xml[^>]*>\s*/, '');
        }
        return xml;
    }
    /**
     * 备用的XML格式化方法
     */
    alternativeXmlFormat(xml, options) {
        // 简单的格式化逻辑作为备用
        const indentStr = ' '.repeat(options.indent);
        let formatted = '';
        let indentLevel = 0;
        let inTag = false;
        let inComment = false;
        let inCdata = false;
        for (let i = 0; i < xml.length; i++) {
            const char = xml[i];
            if (i + 3 < xml.length && xml.substr(i, 4) === '<!--') {
                inComment = true;
            }
            if (i + 2 < xml.length && xml.substr(i, 3) === '-->') {
                inComment = false;
            }
            if (i + 8 < xml.length && xml.substr(i, 9) === '<![CDATA[') {
                inCdata = true;
            }
            if (i + 2 < xml.length && xml.substr(i, 3) === ']]>') {
                inCdata = false;
            }
            if (char === '<' && !inComment && !inCdata) {
                inTag = true;
                if (i > 0 && xml[i - 1] !== '\n') {
                    formatted += '\n' + indentStr.repeat(indentLevel);
                }
            }
            if (char === '>' && inTag && !inComment && !inCdata) {
                inTag = false;
                // 检查是否是关闭标签或自闭合标签
                if (i > 1 && xml[i - 1] === '/') {
                    // 自闭合标签
                }
                else if (i > 1 && xml[i - 1] !== '?' && xml[i - 1] !== '!') {
                    const j = xml.lastIndexOf('<', i - 1);
                    if (j >= 0 && xml[j + 1] === '/') {
                        // 关闭标签
                        indentLevel = Math.max(0, indentLevel - 1);
                    }
                    else {
                        // 开始标签
                        indentLevel++;
                    }
                }
            }
            formatted += char;
        }
        return formatted.trim();
    }
    /**
     * 计算XML统计信息
     */
    calculateXmlStatistics(xml) {
        const elements = (xml.match(/<[a-zA-Z_][^>]*[^/]>/g) || []).length +
            (xml.match(/<[a-zA-Z_][^>]*\/>/g) || []).length;
        const attributes = (xml.match(/\s[a-zA-Z_][a-zA-Z0-9_:-]*\s*=/g) || []).length;
        const comments = (xml.match(/<!--[\s\S]*?-->/g) || []).length;
        return { elements, attributes, comments };
    }
}
exports.XmlFormatter = XmlFormatter;
//# sourceMappingURL=XmlFormatter.js.map