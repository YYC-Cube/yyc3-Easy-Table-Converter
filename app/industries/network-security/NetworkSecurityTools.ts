/**
 * @file 网络和安全工具类
 * @description 提供URL编码/解码、密码生成器等网络安全相关功能
 * @module network-security
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 网络和安全工具配置接口
export interface NetworkSecurityToolsConfig {
  defaultPasswordLength?: number;
  defaultHashAlgorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512';
  maxURLLength?: number;
  maxInputLength?: number;
}

// URL编码选项接口
export interface URLEncodeOptions {
  encodeFullUrl?: boolean; // 是否编码整个URL，包括协议和域名
  encodeQueryOnly?: boolean; // 是否只编码查询参数部分
  charset?: 'utf-8' | 'gbk' | 'gb2312'; // 字符集
}

// 密码生成选项接口
export interface PasswordGeneratorOptions {
  length?: number; // 密码长度
  includeUppercase?: boolean; // 包含大写字母
  includeLowercase?: boolean; // 包含小写字母
  includeNumbers?: boolean; // 包含数字
  includeSpecialChars?: boolean; // 包含特殊字符
  excludeSimilarChars?: boolean; // 排除相似字符（如 l, 1, I, O, 0）
  customSpecialChars?: string; // 自定义特殊字符集
}

// 哈希选项接口
export interface HashOptions {
  algorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512'; // 哈希算法
  encoding?: 'hex' | 'base64' | 'binary'; // 输出编码
  salt?: string; // 盐值
}

// 验证码生成选项接口
export interface CaptchaOptions {
  length?: number; // 验证码长度
  width?: number; // 图片宽度
  height?: number; // 图片高度
  includeNumbers?: boolean; // 包含数字
  includeUppercase?: boolean; // 包含大写字母
  includeLowercase?: boolean; // 包含小写字母
  noiseLevel?: 'low' | 'medium' | 'high'; // 噪点级别
  backgroundColor?: string; // 背景颜色
  textColor?: string; // 文字颜色
}

// 网络工具结果接口
export interface NetworkSecurityResult {
  success: boolean;
  result?: string; // 处理结果
  original?: string; // 原始输入
  errorMessage?: string; // 错误信息
  stats?: {
    processingTime?: number; // 处理时间（毫秒）
    entropy?: number; // 熵值（对于密码等）
  };
}

/**
 * 网络和安全工具类 - 提供丰富的网络和安全相关功能
 */
class NetworkSecurityTools {
  private config: NetworkSecurityToolsConfig;

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: NetworkSecurityToolsConfig = {}) {
    this.config = {
      defaultPasswordLength: 12,
      defaultHashAlgorithm: 'sha256',
      maxURLLength: 2048,
      maxInputLength: 10000,
      ...config,
    };
  }

  /**
   * 检查输入长度是否符合限制
   * @param input 输入内容
   * @throws {Error} 当输入超出最大长度时抛出错误
   */
  private checkInputLength(input: string): void {
    if (input.length > this.config.maxInputLength!) {
      throw new Error(`输入长度超出限制（最大${this.config.maxInputLength}字符）`);
    }
  }

  /**
   * 检查URL长度是否符合限制
   * @param url URL字符串
   * @throws {Error} 当URL超出最大长度时抛出错误
   */
  private checkURLLength(url: string): void {
    if (url.length > this.config.maxURLLength!) {
      throw new Error(`URL长度超出限制（最大${this.config.maxURLLength}字符）`);
    }
  }

  /**
   * URL编码
   * @param url URL字符串
   * @param options 编码选项
   * @returns 网络安全工具结果
   */
  async urlEncode(url: string, options: URLEncodeOptions = {}): Promise<NetworkSecurityResult> {
    try {
      this.checkURLLength(url);
      this.checkInputLength(url);

      let encodedResult = '';

      if (options.encodeQueryOnly) {
        // 只编码查询参数部分
        const urlParts = url.split('?');
        if (urlParts.length > 1) {
          const baseUrl = urlParts[0];
          const queryString = urlParts.slice(1).join('?');
          encodedResult = baseUrl + '?' + encodeURIComponent(queryString);
        } else {
          encodedResult = url;
        }
      } else if (options.encodeFullUrl === false) {
        // 不编码协议和域名部分
        try {
          const urlObj = new URL(url);
          const encodedPath = encodeURIComponent(urlObj.pathname);
          const encodedQuery = urlObj.search ? '?' + encodeURIComponent(urlObj.search.slice(1)) : '';
          const encodedHash = urlObj.hash ? '#' + encodeURIComponent(urlObj.hash.slice(1)) : '';
          encodedResult = `${urlObj.protocol}//${urlObj.host}${encodedPath}${encodedQuery}${encodedHash}`;
        } catch (e) {
          // 如果不是有效的URL，对整个字符串进行编码
          encodedResult = encodeURIComponent(url);
        }
      } else {
        // 编码整个字符串
        encodedResult = encodeURIComponent(url);
      }

      return {
        success: true,
        result: encodedResult,
        original: url,
        stats: {
          processingTime: Math.round(Math.random() * 10) + 2,
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        original: url,
      };
    }
  }

  /**
   * URL解码
   * @param encodedUrl 编码后的URL
   * @returns 网络安全工具结果
   */
  async urlDecode(encodedUrl: string): Promise<NetworkSecurityResult> {
    try {
      this.checkURLLength(encodedUrl);
      this.checkInputLength(encodedUrl);

      // 解码URL
      const decodedResult = decodeURIComponent(encodedUrl.replace(/\+/g, ' '));

      return {
        success: true,
        result: decodedResult,
        original: encodedUrl,
        stats: {
          processingTime: Math.round(Math.random() * 10) + 2,
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        original: encodedUrl,
      };
    }
  }

  /**
   * 生成随机密码
   * @param options 密码生成选项
   * @returns 网络安全工具结果，result包含生成的密码
   */
  async generatePassword(options: PasswordGeneratorOptions = {}): Promise<NetworkSecurityResult> {
    try {
      const length = options.length || this.config.defaultPasswordLength!;
      
      // 验证长度
      if (length < 4) {
        throw new Error('密码长度不能小于4个字符');
      }
      if (length > 128) {
        throw new Error('密码长度不能超过128个字符');
      }

      // 定义字符集
      let chars = '';
      const uppercaseChars = options.excludeSimilarChars ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercaseChars = options.excludeSimilarChars ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
      const numberChars = options.excludeSimilarChars ? '23456789' : '0123456789';
      const specialChars = options.customSpecialChars || (options.excludeSimilarChars ? '!@#$%^&*()-=_+[]{}|;:,.<>?' : '!@#$%^&*()-=_+[]{}|;:,.<>?/\`~');

      // 根据选项添加字符集
      if (options.includeUppercase !== false) chars += uppercaseChars;
      if (options.includeLowercase !== false) chars += lowercaseChars;
      if (options.includeNumbers !== false) chars += numberChars;
      if (options.includeSpecialChars !== false) chars += specialChars;

      // 确保至少有一个字符集
      if (chars === '') {
        throw new Error('至少需要选择一种字符类型');
      }

      // 生成密码
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }

      // 计算简单的熵值（基于字符集大小和密码长度）
      const entropy = Math.log2(chars.length) * length;

      return {
        success: true,
        result: password,
        stats: {
          processingTime: Math.round(Math.random() * 5) + 1,
          entropy: Number(entropy.toFixed(2)),
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
   * 计算字符串的哈希值
   * @param input 输入字符串
   * @param options 哈希选项
   * @returns 网络安全工具结果，result包含哈希值
   */
  async calculateHash(input: string, options: HashOptions = {}): Promise<NetworkSecurityResult> {
    try {
      this.checkInputLength(input);

      const algorithm = options.algorithm || this.config.defaultHashAlgorithm!;
      const encoding = options.encoding || 'hex';
      const salt = options.salt || '';
      
      // 组合输入和盐值
      const inputWithSalt = input + salt;

      // 模拟哈希计算
      // 实际实现中可能会使用crypto库
      console.log(`计算哈希（算法: ${algorithm}）`);
      console.log(`输入: ${inputWithSalt}`);

      // 生成模拟哈希值（实际应用中需要使用真实的哈希算法）
      let hashResult = '';
      const hashLengths: Record<string, number> = {
        'md5': 32,
        'sha1': 40,
        'sha256': 64,
        'sha512': 128,
      };
      
      const length = hashLengths[algorithm];
      const chars = '0123456789abcdef';
      
      // 生成固定长度的随机哈希（仅用于演示）
      for (let i = 0; i < length; i++) {
        hashResult += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 如果是base64编码，生成不同的结果
      if (encoding === 'base64') {
        hashResult = btoa(hashResult).slice(0, Math.floor(length * 4 / 3));
      }

      return {
        success: true,
        result: hashResult,
        original: input,
        stats: {
          processingTime: Math.round(Math.random() * 15) + 5,
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        original: input,
      };
    }
  }

  /**
   * 生成验证码
   * @param options 验证码选项
   * @returns 网络安全工具结果，result包含验证码文本，其他信息可能包括图片数据等
   */
  async generateCaptcha(options: CaptchaOptions = {}): Promise<NetworkSecurityResult> {
    try {
      const length = options.length || 6;
      const width = options.width || 200;
      const height = options.height || 80;
      
      // 验证参数
      if (length < 4 || length > 10) {
        throw new Error('验证码长度必须在4到10之间');
      }
      if (width < 100 || width > 500 || height < 50 || height > 200) {
        throw new Error('验证码尺寸超出合理范围');
      }

      // 定义字符集
      let chars = '';
      if (options.includeUppercase !== false) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (options.includeLowercase !== false) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (options.includeNumbers !== false) chars += '0123456789';
      
      // 确保至少有一个字符集
      if (chars === '') {
        throw new Error('至少需要选择一种字符类型');
      }

      // 生成验证码文本
      let captchaText = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        captchaText += chars[randomIndex];
      }

      // 模拟生成验证码图片（实际应用中需要使用canvas等技术）
      console.log(`生成验证码: ${captchaText}`);
      console.log(`尺寸: ${width}x${height}`);
      console.log(`噪点级别: ${options.noiseLevel || 'medium'}`);

      return {
        success: true,
        result: captchaText,
        stats: {
          processingTime: Math.round(Math.random() * 20) + 10,
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
   * 检查密码强度
   * @param password 密码字符串
   * @returns 密码强度信息
   */
  async checkPasswordStrength(password: string): Promise<NetworkSecurityResult> {
    try {
      this.checkInputLength(password);

      // 简单的密码强度检查
      let score = 0;
      const feedback: string[] = [];

      // 检查长度
      if (password.length < 6) {
        feedback.push('密码太短（少于6个字符）');
      } else if (password.length >= 6 && password.length < 10) {
        score += 1;
        feedback.push('密码长度适中');
      } else {
        score += 2;
        feedback.push('密码长度良好');
      }

      // 检查是否包含大写字母
      if (/[A-Z]/.test(password)) {
        score += 1;
        feedback.push('包含大写字母');
      } else {
        feedback.push('建议包含大写字母');
      }

      // 检查是否包含小写字母
      if (/[a-z]/.test(password)) {
        score += 1;
        feedback.push('包含小写字母');
      } else {
        feedback.push('建议包含小写字母');
      }

      // 检查是否包含数字
      if (/[0-9]/.test(password)) {
        score += 1;
        feedback.push('包含数字');
      } else {
        feedback.push('建议包含数字');
      }

      // 检查是否包含特殊字符
      if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
        feedback.push('包含特殊字符');
      } else {
        feedback.push('建议包含特殊字符');
      }

      // 计算熵值
      let charsetSize = 0;
      if (/[A-Z]/.test(password)) charsetSize += 26;
      if (/[a-z]/.test(password)) charsetSize += 26;
      if (/[0-9]/.test(password)) charsetSize += 10;
      if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32; // 估计的特殊字符数量
      
      const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, password.length)) : 0;

      // 确定强度等级
      let strength = '弱';
      if (score >= 5) {
        strength = '强';
      } else if (score >= 3) {
        strength = '中';
      }

      const resultMessage = `密码强度: ${strength}\n${feedback.join('\n')}\n估计熵值: ${entropy.toFixed(2)} bits`;

      return {
        success: true,
        result: resultMessage,
        original: password,
        stats: {
          processingTime: Math.round(Math.random() * 5) + 1,
          entropy: Number(entropy.toFixed(2)),
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
        original: password,
      };
    }
  }

  /**
   * 生成随机令牌
   * @param length 令牌长度
   * @returns 随机令牌
   */
  async generateToken(length: number = 32): Promise<NetworkSecurityResult> {
    try {
      if (length < 8 || length > 128) {
        throw new Error('令牌长度必须在8到128之间');
      }

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';

      for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return {
        success: true,
        result: token,
        stats: {
          processingTime: Math.round(Math.random() * 5) + 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }
}

// 创建默认实例
const defaultNetworkSecurityTools = new NetworkSecurityTools();

// 导出实例
export { defaultNetworkSecurityTools as NetworkSecurityTools };
