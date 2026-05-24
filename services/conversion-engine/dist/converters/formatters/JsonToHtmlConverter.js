"use strict";
/**
 * @file JSON到HTML转换器
 * @description 实现JSON数据结构到HTML文档的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonToHtmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * JSON到HTML转换器类
 */
class JsonToHtmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON到HTML转换器', '将JSON数据结构转换为格式化的HTML文档', ['json', 'js'], ['html']);
    }
    /**
     * 执行JSON到HTML的转换
     * @param inputData JSON输入数据
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
                includeHtmlWrapper: options.includeHtmlWrapper ?? true,
                includeHead: options.includeHead ?? true,
                includeBody: options.includeBody ?? true,
                title: options.title ?? 'JSON to HTML',
                css: options.css ?? this.getDefaultCss(),
                prettyPrint: options.prettyPrint ?? true,
                indent: options.indent ?? 2,
                textNodeKey: options.textNodeKey ?? '_text',
                attributePrefix: options.attributePrefix ?? '_',
                rootElement: options.rootElement ?? 'div',
                tableClassName: options.tableClassName ?? 'json-table',
                listClassName: options.listClassName ?? 'json-list',
                objectClassName: options.objectClassName ?? 'json-object',
                arrayClassName: options.arrayClassName ?? 'json-array',
                keyClassName: options.keyClassName ?? 'json-key',
                valueClassName: options.valueClassName ?? 'json-value',
                includeAttributeTypes: options.includeAttributeTypes ?? false,
                maxDepth: options.maxDepth ?? 20,
                useSemanticHtml: options.useSemanticHtml ?? true,
                collapseEmptyArrays: options.collapseEmptyArrays ?? true,
                collapseEmptyObjects: options.collapseEmptyObjects ?? true,
                includeJsonSchema: options.includeJsonSchema ?? false,
                ...options
            };
            // 将Buffer转换为字符串
            let jsonContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 尝试解析JavaScript模块导出格式
            if (inputFormat === 'js') {
                jsonContent = this.extractJsonFromJsModule(jsonContent);
            }
            // 解析JSON
            let parsedData;
            try {
                parsedData = JSON.parse(jsonContent);
            }
            catch (error) {
                throw new Error('无效的JSON格式');
            }
            // 执行转换并测量性能
            const { result: htmlContent, duration } = await this.measurePerformance(() => {
                return this.jsonToHtml(parsedData, convertOptions);
            });
            // 计算统计信息
            const statistics = this.calculateJsonToHtmlStatistics(parsedData, htmlContent);
            // 返回成功结果
            return this.createSuccessResult(htmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(htmlContent),
                elements: statistics.elements,
                tables: statistics.tables,
                lists: statistics.lists,
                attributes: statistics.attributes,
                jsonObjects: statistics.jsonObjects,
                jsonArrays: statistics.jsonArrays,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON到HTML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 从JavaScript模块中提取JSON
     */
    extractJsonFromJsModule(jsContent) {
        // 尝试提取module.exports内容
        const moduleExportsMatch = jsContent.match(/module\.exports\s*=\s*([\s\S]*);/);
        if (moduleExportsMatch) {
            return moduleExportsMatch[1];
        }
        // 尝试提取export default内容
        const exportDefaultMatch = jsContent.match(/export\s+default\s*([\s\S]*);/);
        if (exportDefaultMatch) {
            return exportDefaultMatch[1];
        }
        throw new Error('无法从JavaScript模块中提取JSON数据');
    }
    /**
     * 获取默认CSS样式
     */
    getDefaultCss() {
        return `
      .json-table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 15px;
        font-family: monospace;
        font-size: 14px;
      }
      .json-table th, .json-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .json-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .json-object {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f9f9f9;
      }
      .json-array {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f0f8ff;
      }
      .json-list {
        padding-left: 20px;
        margin: 5px 0;
      }
      .json-key {
        font-weight: bold;
        color: #0066cc;
      }
      .json-value {
        color: #009933;
      }
      .json-type {
        font-size: 12px;
        color: #666;
        margin-left: 5px;
      }
      .json-empty {
        color: #999;
        font-style: italic;
      }
      .json-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
      }
    `;
    }
    /**
     * JSON转HTML的核心方法
     */
    jsonToHtml(data, options, depth = 0) {
        const indentStr = ' '.repeat(options.indent * depth);
        const nextIndentStr = ' '.repeat(options.indent * (depth + 1));
        // 检查最大深度
        if (depth >= options.maxDepth) {
            return `${indentStr}<div class="json-max-depth">[最大深度限制]</div>`;
        }
        // 构建完整HTML文档
        if (depth === 0 && options.includeHtmlWrapper) {
            let html = '<!DOCTYPE html>\n';
            html += '<html>\n';
            if (options.includeHead) {
                html += '<head>\n';
                html += `<title>${options.title}</title>\n`;
                if (options.css) {
                    html += `<style>\n${options.css}\n</style>\n`;
                }
                html += '</head>\n';
            }
            if (options.includeBody) {
                html += '<body>\n';
                html += `<${options.rootElement} class="json-container">\n`;
                html += this.jsonToHtml(data, options, depth + 1);
                html += `</${options.rootElement}>\n`;
                html += '</body>\n';
            }
            html += '</html>';
            return html;
        }
        let result = '';
        // 根据数据类型进行转换
        if (data === null) {
            result = `${indentStr}<span class="json-value">null</span>`;
        }
        else if (data === undefined) {
            result = `${indentStr}<span class="json-value">undefined</span>`;
        }
        else if (typeof data === 'boolean') {
            result = `${indentStr}<span class="json-value">${data}</span>`;
        }
        else if (typeof data === 'number') {
            result = `${indentStr}<span class="json-value">${data}</span>`;
        }
        else if (typeof data === 'string') {
            // 转义HTML特殊字符
            const escaped = data
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            result = `${indentStr}<span class="json-value">"${escaped}"</span>`;
        }
        else if (Array.isArray(data)) {
            // 处理空数组
            if (data.length === 0 && options.collapseEmptyArrays) {
                result = `${indentStr}<div class="${options.arrayClassName}">[] <span class="json-empty">空数组</span></div>`;
            }
            else {
                result = `${indentStr}<div class="${options.arrayClassName}">\n`;
                result += `${nextIndentStr}<div class="json-header">数组 (${data.length} 项)</div>\n`;
                result += `${nextIndentStr}<ul class="${options.listClassName}">\n`;
                data.forEach((item, index) => {
                    result += `${' '.repeat(options.indent * (depth + 2))}<li>\n`;
                    result += `${' '.repeat(options.indent * (depth + 3))}<span class="${options.keyClassName}">${index}:</span>\n`;
                    result += this.jsonToHtml(item, options, depth + 4);
                    result += `${' '.repeat(options.indent * (depth + 2))}</li>\n`;
                });
                result += `${nextIndentStr}</ul>\n`;
                result += `${indentStr}</div>`;
            }
        }
        else if (typeof data === 'object') {
            const keys = Object.keys(data);
            // 处理空对象
            if (keys.length === 0 && options.collapseEmptyObjects) {
                result = `${indentStr}<div class="${options.objectClassName}">{}</div>`;
            }
            else {
                // 对于表格数据优先使用表格展示
                if (this.isTableData(data)) {
                    result = this.renderAsTable(data, options, indentStr, nextIndentStr, depth);
                }
                else {
                    result = `${indentStr}<div class="${options.objectClassName}">\n`;
                    result += `${nextIndentStr}<div class="json-header">对象 (${keys.length} 个属性)</div>\n`;
                    result += `${nextIndentStr}<table class="${options.tableClassName}">\n`;
                    result += `${' '.repeat(options.indent * (depth + 2))}<thead>\n`;
                    result += `${' '.repeat(options.indent * (depth + 3))}<tr>\n`;
                    result += `${' '.repeat(options.indent * (depth + 4))}<th>属性</th>\n`;
                    result += `${' '.repeat(options.indent * (depth + 4))}<th>值</th>\n`;
                    if (options.includeAttributeTypes) {
                        result += `${' '.repeat(options.indent * (depth + 4))}<th>类型</th>\n`;
                    }
                    result += `${' '.repeat(options.indent * (depth + 3))}</tr>\n`;
                    result += `${' '.repeat(options.indent * (depth + 2))}</thead>\n`;
                    result += `${' '.repeat(options.indent * (depth + 2))}<tbody>\n`;
                    keys.forEach(key => {
                        const value = data[key];
                        const isAttribute = key.startsWith(options.attributePrefix);
                        result += `${' '.repeat(options.indent * (depth + 3))}<tr${isAttribute ? ' class="json-attribute"' : ''}>\n`;
                        result += `${' '.repeat(options.indent * (depth + 4))}<td class="${options.keyClassName}">${key}</td>\n`;
                        result += `${' '.repeat(options.indent * (depth + 4))}<td>\n`;
                        result += this.jsonToHtml(value, options, depth + 5);
                        result += `${' '.repeat(options.indent * (depth + 4))}</td>\n`;
                        if (options.includeAttributeTypes) {
                            const type = this.getDataType(value);
                            result += `${' '.repeat(options.indent * (depth + 4))}<td class="json-type">${type}</td>\n`;
                        }
                        result += `${' '.repeat(options.indent * (depth + 3))}</tr>\n`;
                    });
                    result += `${' '.repeat(options.indent * (depth + 2))}</tbody>\n`;
                    result += `${nextIndentStr}</table>\n`;
                    result += `${indentStr}</div>`;
                }
            }
        }
        return result;
    }
    /**
     * 判断是否为表格数据
     */
    isTableData(data) {
        // 检查是否是数组并且所有元素都是对象
        if (Array.isArray(data)) {
            return data.length > 0 && data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        }
        return false;
    }
    /**
     * 将数据渲染为表格
     */
    renderAsTable(data, options, indentStr, nextIndentStr, depth) {
        let result = '';
        if (Array.isArray(data) && data.length > 0) {
            // 获取所有唯一的键作为表头
            const allKeys = new Set();
            data.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    Object.keys(item).forEach(key => allKeys.add(key));
                }
            });
            const headers = Array.from(allKeys);
            result = `${indentStr}<div class="${options.objectClassName}">\n`;
            result += `${nextIndentStr}<div class="json-header">表格数据 (${data.length} 行)</div>\n`;
            result += `${nextIndentStr}<table class="${options.tableClassName}">\n`;
            result += `${' '.repeat(options.indent * (depth + 2))}<thead>\n`;
            result += `${' '.repeat(options.indent * (depth + 3))}<tr>\n`;
            headers.forEach(header => {
                result += `${' '.repeat(options.indent * (depth + 4))}<th>${header}</th>\n`;
            });
            result += `${' '.repeat(options.indent * (depth + 3))}</tr>\n`;
            result += `${' '.repeat(options.indent * (depth + 2))}</thead>\n`;
            result += `${' '.repeat(options.indent * (depth + 2))}<tbody>\n`;
            data.forEach((row, rowIndex) => {
                result += `${' '.repeat(options.indent * (depth + 3))}<tr>\n`;
                headers.forEach(header => {
                    const value = row[header] !== undefined ? row[header] : '';
                    result += `${' '.repeat(options.indent * (depth + 4))}<td>\n`;
                    result += this.jsonToHtml(value, options, depth + 5);
                    result += `${' '.repeat(options.indent * (depth + 4))}</td>\n`;
                });
                result += `${' '.repeat(options.indent * (depth + 3))}</tr>\n`;
            });
            result += `${' '.repeat(options.indent * (depth + 2))}</tbody>\n`;
            result += `${nextIndentStr}</table>\n`;
            result += `${indentStr}</div>`;
        }
        return result;
    }
    /**
     * 获取数据类型
     */
    getDataType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        return typeof value;
    }
    /**
     * 计算JSON到HTML转换的统计信息
     */
    calculateJsonToHtmlStatistics(jsonData, htmlContent) {
        // 计算HTML元素数量
        const elements = (htmlContent.match(/<[a-zA-Z][a-zA-Z0-9]*[^>]*>/) || []).length;
        const tables = (htmlContent.match(/<table[^>]*>/) || []).length;
        const lists = (htmlContent.match(/<(ul|ol)[^>]*>/) || []).length;
        const attributes = (htmlContent.match(/\s[a-zA-Z][a-zA-Z0-9:-]+=["'][^"']*["']/) || []).length;
        // 计算JSON对象和数组数量
        const jsonStats = this.countJsonObjects(jsonData);
        return {
            elements,
            tables,
            lists,
            attributes,
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
exports.JsonToHtmlConverter = JsonToHtmlConverter;
//# sourceMappingURL=JsonToHtmlConverter.js.map