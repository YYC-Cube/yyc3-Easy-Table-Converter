/**
 * @file 代码处理类工具
 * @description 提供代码格式化、压缩、差异比较等功能
 * @module code-processing
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 代码处理工具配置接口
export interface CodeProcessingToolsConfig {
  maxFileSize?: number; // 最大文件大小（字节）
  maxLines?: number; // 最大行数限制
  defaultIndentSize?: number; // 默认缩进大小
  defaultLineEnding?: 'LF' | 'CRLF' | 'CR'; // 默认行尾字符
}

// 代码格式化选项接口
export interface CodeFormatOptions {
  language: string; // 编程语言
  indentSize?: number; // 缩进大小
  useTabs?: boolean; // 是否使用制表符
  lineEnding?: 'LF' | 'CRLF' | 'CR'; // 行尾字符
  maxLineLength?: number; // 最大行长度
  preserveComments?: boolean; // 是否保留注释
}

// 代码压缩选项接口
export interface CodeMinifyOptions {
  language: string; // 编程语言
  removeComments?: boolean; // 是否移除注释
  mangleVariables?: boolean; // 是否混淆变量名
  preserveFunctionNames?: boolean; // 是否保留函数名
  preserveLicenseComments?: boolean; // 是否保留许可证注释
}

// 代码差异比较选项接口
export interface CodeDiffOptions {
  ignoreWhitespace?: boolean; // 是否忽略空白字符
  ignoreCase?: boolean; // 是否忽略大小写
  ignoreComments?: boolean; // 是否忽略注释
  contextLines?: number; // 上下文行数
  outputFormat?: 'unified' | 'context' | 'inline'; // 输出格式
}

// 代码分析结果接口
export interface CodeAnalysisResult {
  language: string; // 检测到的编程语言
  lines: number; // 行数
  words: number; // 单词数
  characters: number; // 字符数
  complexity?: number; // 复杂度（如果可用）
  functions?: number; // 函数数量
  classes?: number; // 类数量
  imports?: string[]; // 导入的模块
  fileSize: number; // 文件大小（字节）
}

// 代码处理结果接口
export interface CodeProcessingResult {
  success: boolean;
  output?: string; // 处理后的代码内容
  outputPath?: string; // 输出文件路径
  originalSize?: number; // 原始大小（字节）
  newSize?: number; // 新大小（字节）
  errorMessage?: string; // 错误信息
  stats?: {
    linesChanged?: number;
    compressionRatio?: number;
    processingTime?: number; // 处理时间（毫秒）
  };
}

/**
 * 代码处理工具类 - 提供丰富的代码处理功能
 */
class CodeProcessingTools {
  private config: CodeProcessingToolsConfig;

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: CodeProcessingToolsConfig = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 默认10MB
      maxLines: 100000,
      defaultIndentSize: 2,
      defaultLineEnding: 'LF',
      ...config,
    };
  }

  /**
   * 检查文件大小是否符合限制
   * @param fileSize 文件大小（字节）
   * @throws {Error} 当文件超出最大大小时抛出错误
   */
  private checkFileSize(fileSize: number): void {
    if (fileSize > this.config.maxFileSize!) {
      throw new Error(`文件大小超出限制（最大${this.config.maxFileSize}字节）`);
    }
  }

  /**
   * 检查行数是否符合限制
   * @param lines 行数
   * @throws {Error} 当行数超出最大限制时抛出错误
   */
  private checkLines(lines: number): void {
    if (lines > this.config.maxLines!) {
      throw new Error(`代码行数超出限制（最大${this.config.maxLines}行）`);
    }
  }

  /**
   * 分析代码文件
   * @param codeContent 代码内容或文件路径
   * @returns 代码分析结果
   */
  async analyzeCode(codeContent: string): Promise<CodeAnalysisResult> {
    try {
      // 确定是文件路径还是代码内容
      const content = codeContent;
      const fileSize = new Blob([content]).size;
      this.checkFileSize(fileSize);

      // 分割代码为行
      const lines = content.split(/\r?\n/);
      this.checkLines(lines.length);

      // 检测编程语言（基于文件名或内容分析）
      // 这里简化实现，实际可能需要更复杂的检测逻辑
      let language = 'text';
      let functions = 0;
      let classes = 0;
      
      // 简单的语言检测示例
      if (/\bfunction\b|\bconst\s+\w+\s*=\s*\(/.test(content)) {
        language = 'javascript';
      } else if (/\bdef\b|\bclass\b/.test(content)) {
        language = 'python';
      } else if (/\bpublic\s+static\s+void\s+main\b/.test(content)) {
        language = 'java';
      } else if (/^#include\s*</.test(content)) {
        language = 'cpp';
      } else if (/^using\s+System\b/.test(content)) {
        language = 'csharp';
      } else if (/\blet\s+|\bvar\s+|\bconst\s+/.test(content)) {
        language = 'javascript';
      } else if (/\binterface\b|\bimplements\b/.test(content)) {
        language = 'typescript';
      }

      // 计算单词数和字符数
      const words = content.split(/\s+/).filter(word => word.length > 0).length;
      const characters = content.length;

      // 统计函数和类（简化实现）
      if (language === 'javascript' || language === 'typescript') {
        functions = (content.match(/\bfunction\b|\bconst\s+\w+\s*=\s*\(/) || []).length;
        classes = (content.match(/\bclass\b/) || []).length;
      } else if (language === 'python') {
        functions = (content.match(/\bdef\b/) || []).length;
        classes = (content.match(/\bclass\b/) || []).length;
      }

      // 提取导入模块（简化实现）
      const imports: string[] = [];
      if (language === 'javascript' || language === 'typescript') {
        const importMatches = content.match(/^\s*(import|from)\s+['"\w\.\/]+/gm);
        if (importMatches) {
          imports.push(...importMatches);
        }
      } else if (language === 'python') {
        const importMatches = content.match(/^\s*(import|from)\s+\w+/gm);
        if (importMatches) {
          imports.push(...importMatches);
        }
      }

      return {
        language,
        lines: lines.length,
        words,
        characters,
        complexity: Math.round(functions * 2 + classes * 3), // 简化的复杂度计算
        functions,
        classes,
        imports,
        fileSize,
      };
    } catch (error) {
      throw new Error(`分析代码失败: ${(error as Error).message}`);
    }
  }

  /**
   * 格式化代码
   * @param codeContent 代码内容
   * @param options 格式化选项
   * @returns 代码处理结果
   */
  async formatCode(
    codeContent: string,
    options: CodeFormatOptions
  ): Promise<CodeProcessingResult> {
    try {
      // 分析代码
      const analysis = await this.analyzeCode(codeContent);
      this.checkFileSize(analysis.fileSize);
      this.checkLines(analysis.lines);

      // 使用指定的语言，或者从分析结果中获取
      const language = options.language || analysis.language;
      
      // 模拟代码格式化
      // 实际实现中可能会使用各种语言的格式化库
      console.log(`格式化代码（语言: ${language}）`);
      console.log(`选项:`, options);

      // 根据不同语言和选项进行格式化处理
      let formattedCode = codeContent;
      const indentSize = options.indentSize || this.config.defaultIndentSize!;
      const indentChar = options.useTabs ? '\t' : ' '.repeat(indentSize);
      
      // 简单的格式化模拟（实际实现会复杂得多）
      if (options.preserveComments !== false) {
        // 保留注释的格式化
        // 这里只是示例，实际需要更复杂的逻辑
        formattedCode = codeContent
          .split(/\r?\n/)
          .map(line => {
            // 移除行前空白并重新添加正确的缩进
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // 简单的缩进逻辑（仅作示例）
            let indentLevel = 0;
            if (trimmed.startsWith('}') || trimmed.startsWith(')') || trimmed.startsWith(']')) {
              indentLevel = 1;
            }
            
            return indentChar.repeat(indentLevel) + trimmed;
          })
          .join(options.lineEnding || this.config.defaultLineEnding! === 'CRLF' ? '\r\n' : '\n');
      }

      // 计算新的大小
      const newSize = new Blob([formattedCode]).size;

      return {
        success: true,
        output: formattedCode,
        originalSize: analysis.fileSize,
        newSize,
        stats: {
          processingTime: Math.round(Math.random() * 50) + 10, // 模拟处理时间
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * 压缩/混淆代码
   * @param codeContent 代码内容
   * @param options 压缩选项
   * @returns 代码处理结果
   */
  async minifyCode(
    codeContent: string,
    options: CodeMinifyOptions
  ): Promise<CodeProcessingResult> {
    try {
      // 分析代码
      const analysis = await this.analyzeCode(codeContent);
      this.checkFileSize(analysis.fileSize);
      this.checkLines(analysis.lines);

      // 模拟代码压缩
      // 实际实现中可能会使用各种语言的压缩库
      console.log(`压缩代码（语言: ${options.language}）`);
      console.log(`选项:`, options);

      // 压缩处理示例（实际实现会复杂得多）
      let minifiedCode = codeContent;
      
      // 移除空白字符
      minifiedCode = minifiedCode
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*,\s*/g, ',')
        .trim();

      // 移除注释（如果配置了）
      if (options.removeComments !== false) {
        if (options.language === 'javascript' || options.language === 'typescript' || options.language === 'css') {
          // 移除行注释
          minifiedCode = minifiedCode.replace(/\/\/.*$/gm, '');
          // 移除块注释
          minifiedCode = minifiedCode.replace(/\/\*[\s\S]*?\*\//g, '');
        } else if (options.language === 'python') {
          // 移除Python的单行注释
          minifiedCode = minifiedCode.replace(/\s*#.*$/gm, '');
        }
      }

      // 计算压缩后的大小
      const newSize = new Blob([minifiedCode]).size;
      const compressionRatio = analysis.fileSize > 0 ? newSize / analysis.fileSize : 1;

      return {
        success: true,
        output: minifiedCode,
        originalSize: analysis.fileSize,
        newSize,
        stats: {
          compressionRatio: Number(compressionRatio.toFixed(3)),
          processingTime: Math.round(Math.random() * 100) + 20, // 模拟处理时间
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * 比较两段代码的差异
   * @param oldCode 旧代码
   * @param newCode 新代码
   * @param options 比较选项
   * @returns 代码处理结果，output包含差异
   */
  async diffCode(
    oldCode: string,
    newCode: string,
    options: CodeDiffOptions = {}
  ): Promise<CodeProcessingResult> {
    try {
      // 检查代码大小
      const oldSize = new Blob([oldCode]).size;
      const newSize = new Blob([newCode]).size;
      this.checkFileSize(Math.max(oldSize, newSize));

      // 应用比较选项
      let code1 = oldCode;
      let code2 = newCode;

      // 忽略空白字符
      if (options.ignoreWhitespace) {
        code1 = code1.replace(/\s+/g, '');
        code2 = code2.replace(/\s+/g, '');
      }

      // 忽略大小写
      if (options.ignoreCase) {
        code1 = code1.toLowerCase();
        code2 = code2.toLowerCase();
      }

      // 忽略注释
      if (options.ignoreComments) {
        // 这里只是简单示例，实际需要更复杂的注释检测
        code1 = code1.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        code2 = code2.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      }

      // 模拟代码差异比较
      // 实际实现中可能会使用diff库
      console.log('比较代码差异');
      console.log(`选项:`, options);

      // 简单的差异比较（实际需要更复杂的实现）
      let diffOutput = '';
      let linesChanged = 0;

      // 按行分割代码
      const oldLines = oldCode.split(/\r?\n/);
      const newLines = newCode.split(/\r?\n/);
      const maxLines = Math.max(oldLines.length, newLines.length);
      const contextLines = options.contextLines || 3;

      // 简单的差异计算（仅作示例）
      for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';

        if (oldLine !== newLine) {
          linesChanged++;
          if (options.outputFormat === 'inline') {
            diffOutput += `- ${oldLine}\n`;
            diffOutput += `+ ${newLine}\n`;
          } else {
            // 统一或上下文格式
            diffOutput += `- ${oldLine}\n`;
            diffOutput += `+ ${newLine}\n`;
          }
        } else if (linesChanged > 0 || i >= maxLines - contextLines) {
          // 添加上下文行
          diffOutput += `  ${oldLine}\n`;
        }
      }

      return {
        success: true,
        output: diffOutput,
        originalSize: oldSize,
        newSize,
        stats: {
          linesChanged,
          processingTime: Math.round(Math.random() * 50) + 10, // 模拟处理时间
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * 高亮代码语法
   * @param codeContent 代码内容
   * @param language 编程语言
   * @returns 带有语法高亮的HTML或其他格式
   */
  async highlightCode(
    codeContent: string,
    language: string
  ): Promise<CodeProcessingResult> {
    try {
      // 分析代码
      const analysis = await this.analyzeCode(codeContent);
      this.checkFileSize(analysis.fileSize);

      // 模拟代码语法高亮
      // 实际实现中可能会使用各种语法高亮库
      console.log(`高亮代码语法（语言: ${language}）`);

      // 简单的语法高亮示例（仅作演示）
      let highlightedCode = codeContent;

      // 为不同类型的语法元素添加标记
      // 注意：这只是一个非常简化的示例，实际高亮需要更复杂的解析
      const syntaxRules: { regex: RegExp; className: string }[] = [
        { regex: /\b(function|class|const|let|var|public|private|protected|static|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally)\b/g, className: 'keyword' },
        { regex: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'constant' },
        { regex: /\b(\d+\.?\d*)\b/g, className: 'number' },
        { regex: /'(.*?)'|"(.*?)"/g, className: 'string' },
        { regex: /\/\/.*$/gm, className: 'comment' },
        { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
      ];

      // 应用语法高亮规则
      syntaxRules.forEach(({ regex, className }) => {
        highlightedCode = highlightedCode.replace(regex, match => {
          return `<span class="${className}">${match}</span>`;
        });
      });

      // 添加HTML包装
      highlightedCode = `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;

      return {
        success: true,
        output: highlightedCode,
        originalSize: analysis.fileSize,
        stats: {
          processingTime: Math.round(Math.random() * 30) + 5, // 模拟处理时间
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * 自动检测代码语言
   * @param codeContent 代码内容
   * @returns 检测到的编程语言
   */
  async detectLanguage(codeContent: string): Promise<string> {
    const analysis = await this.analyzeCode(codeContent);
    return analysis.language;
  }
}

// 创建默认实例
const defaultCodeProcessingTools = new CodeProcessingTools();

// 导出实例
export { defaultCodeProcessingTools as CodeProcessingTools };
