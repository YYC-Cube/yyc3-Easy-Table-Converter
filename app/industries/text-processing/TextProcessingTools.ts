/**
 * @file 文本处理类工具
 * @description 提供文本摘要、翻译、正则测试器等文本处理功能
 * @module text-processing
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 文本处理工具配置接口
export interface TextProcessingToolsConfig {
  maxTextLength?: number;
  defaultLanguage?: string;
  timeout?: number;
}

// 文本摘要结果接口
export interface SummaryResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

// 翻译结果接口
export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

// 正则测试结果接口
export interface RegexTestResult {
  matches: string[];
  matchCount: number;
  groups?: Record<string, string[]>;
  isValid: boolean;
  errorMessage?: string;
}

// 文本分析结果接口
export interface TextAnalysisResult {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // 分钟
  speakingTime: number; // 分钟
  averageWordLength: number;
  averageSentenceLength: number;
}

// 文本格式化选项
export interface FormatOptions {
  removeExtraSpaces?: boolean;
  capitalizeSentences?: boolean;
  fixPunctuation?: boolean;
  normalizeQuotes?: boolean;
}

/**
 * 文本处理工具类 - 提供丰富的文本处理功能
 */
class TextProcessingTools {
  private config: TextProcessingToolsConfig;

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: TextProcessingToolsConfig = {}) {
    this.config = {
      maxTextLength: 1000000,
      defaultLanguage: 'zh',
      timeout: 30000,
      ...config,
    };
  }

  /**
   * 检查文本大小是否符合限制
   * @param text 待检查的文本
   * @throws {Error} 当文本超出最大长度时抛出错误
   */
  private checkTextSize(text: string): void {
    if (text.length > this.config.maxTextLength!) {
      throw new Error(`文本长度超出限制（最大${this.config.maxTextLength}字符）`);
    }
  }

  /**
   * 生成文本摘要
   * @param text 原始文本
   * @param maxLength 摘要最大长度
   * @returns 摘要结果
   */
  async generateSummary(text: string, maxLength: number = 150): Promise<SummaryResult> {
    this.checkTextSize(text);
    
    // 模拟文本摘要生成逻辑
    // 实际实现中可能会调用NLP库或API
    const words = text.split(/\s+/);
    const summaryWords = words.slice(0, Math.ceil(words.length * (maxLength / text.length)));
    const summary = summaryWords.join(' ').substring(0, maxLength) + '...';
    
    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: summary.length / text.length,
    };
  }

  /**
   * 翻译文本
   * @param text 待翻译文本
   * @param targetLanguage 目标语言
   * @param sourceLanguage 源语言（可选，自动检测）
   * @returns 翻译结果
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    this.checkTextSize(text);
    
    // 模拟翻译逻辑
    // 实际实现中可能会调用翻译API
    const translatedText = `[${targetLanguage}] ${text}`;
    
    return {
      translatedText,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      confidence: 0.95,
    };
  }

  /**
   * 测试正则表达式
   * @param text 待测试文本
   * @param pattern 正则表达式模式
   * @param flags 正则表达式标志
   * @returns 正则测试结果
   */
  testRegex(text: string, pattern: string, flags: string = ''): RegexTestResult {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(text.matchAll(regex));
      
      const result: RegexTestResult = {
        matches: matches.map(match => match[0]),
        matchCount: matches.length,
        isValid: true,
      };
      
      // 提取捕获组
      if (matches.length > 0 && matches[0].groups) {
        result.groups = {};
        Object.keys(matches[0].groups).forEach(groupName => {
          result.groups![groupName] = matches.map(match => match.groups![groupName]);
        });
      }
      
      return result;
    } catch (error) {
      return {
        matches: [],
        matchCount: 0,
        isValid: false,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * 分析文本统计信息
   * @param text 待分析文本
   * @returns 文本分析结果
   */
  analyzeText(text: string): TextAnalysisResult {
    this.checkTextSize(text);
    
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    const paragraphCount = text.split(/\n+/).filter(paragraph => paragraph.trim().length > 0).length;
    
    // 平均阅读速度：每分钟200-250字
    const readingTime = wordCount / 225;
    // 平均说话速度：每分钟150-160字
    const speakingTime = wordCount / 155;
    
    const averageWordLength = wordCount > 0 ? characterCount / wordCount : 0;
    const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      readingTime,
      speakingTime,
      averageWordLength,
      averageSentenceLength,
    };
  }

  /**
   * 格式化文本
   * @param text 原始文本
   * @param options 格式化选项
   * @returns 格式化后的文本
   */
  formatText(text: string, options: FormatOptions = {}): string {
    this.checkTextSize(text);
    let result = text;
    
    // 移除多余空格
    if (options.removeExtraSpaces) {
      result = result.replace(/\s+/g, ' ').trim();
    }
    
    // 句子首字母大写
    if (options.capitalizeSentences) {
      result = result.replace(/([.!?]\s*)([a-z])/g, (_match, p1, p2) => p1 + p2.toUpperCase());
      // 确保第一个句子也大写
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    // 修复标点符号
    if (options.fixPunctuation) {
      // 在标点符号前添加空格
      result = result.replace(/(\S)([.!?,;:])/g, '$1 $2');
      // 移除标点符号后的多余空格
      result = result.replace(/([.!?,;:])\s+/g, '$1 ');
    }
    
    // 规范化引号
    if (options.normalizeQuotes) {
      result = result.replace(/['"]/g, '"');
    }
    
    return result;
  }

  /**
   * 提取文本中的关键词
   * @param text 原始文本
   * @param topN 返回的关键词数量
   * @returns 关键词数组
   */
  extractKeywords(text: string, topN: number = 10): string[] {
    this.checkTextSize(text);
    
    // 简单的关键词提取实现
    // 实际实现中可能会使用TF-IDF或其他算法
    const stopWords = new Set(['的', '了', '是', '在', '有', '和', '与', '或', '但', '而', '如果', '因为', '所以', '这个', '那个']);
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 1 && !stopWords.has(word));
    
    // 统计词频
    const wordCounts: Record<string, number> = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
    
    // 按词频排序并返回前N个
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([word]) => word);
  }

  /**
   * 检测文本语言
   * @param text 待检测文本
   * @returns 检测到的语言代码
   */
  detectLanguage(text: string): string {
    this.checkTextSize(text);
    
    // 简单的语言检测实现
    // 实际实现中可能会使用更复杂的语言检测库
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
    const latinChars = text.match(/[a-zA-Z]/g);
    
    if (chineseChars && latinChars) {
      // 如果同时包含中文和拉丁字符，根据数量判断
      return chineseChars.length > latinChars.length ? 'zh' : 'en';
    } else if (chineseChars) {
      return 'zh';
    } else if (latinChars) {
      return 'en';
    }
    
    return this.config.defaultLanguage!;
  }
}

// 创建默认实例
const defaultTextProcessingTools = new TextProcessingTools();

// 导出实例
export { defaultTextProcessingTools as TextProcessingTools };
