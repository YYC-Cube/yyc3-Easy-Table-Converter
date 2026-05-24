/**
 * @file Base64 工具函数
 * @description 提供文本和图片与 Base64 编码之间的转换功能
 * @module converters/base64
 * @author YYC
 */

/**
 * 将文本编码为 Base64
 * @param text 要编码的文本
 * @returns Base64 编码后的字符串
 */
export function encodeTextToBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)))
  } catch (error) {
    throw new Error('Base64 编码失败')
  }
}

/**
 * 将 Base64 解码为文本
 * @param base64 Base64 编码的字符串
 * @returns 解码后的文本
 */
export function decodeBase64ToText(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)))
  } catch (error) {
    throw new Error('Base64 解码失败，请检查输入是否为有效的 Base64 编码')
  }
}

/**
 * 将文件编码为 Base64
 * @param file 要编码的文件
 * @returns Promise<string> Base64 编码后的字符串
 */
export function encodeFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data URL 前缀
      const base64String = result.split(',')[1] || result
      resolve(base64String)
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * 检查字符串是否为有效的图片 Base64 编码
 * @param base64 Base64 字符串
 * @returns boolean 是否为图片 Base64
 */
export function isImageBase64(base64: string): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  // 如果是完整的 data URL
  if (base64.startsWith('data:image/')) {
    return imageTypes.some(type => base64.includes(type))
  }
  // 对于纯 Base64 字符串，尝试解码并检查文件头特征
  try {
    const binary = atob(base64)
    // JPEG 文件头：FF D8
    // PNG 文件头：89 50 4E 47 0D 0A 1A 0A
    return binary.startsWith('\xff\xd8') || binary.startsWith('\x89PNG')
  } catch {
    return false
  }
}

/**
 * 估算 Base64 编码的实际字节大小
 * @param base64 Base64 字符串
 * @returns number 估算的字节大小
 */
export function estimateBase64Size(base64: string): number {
  // Base64 编码的实际大小 = 编码字符数 * 3/4（减去填充字符）
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length * 3 / 4) - padding
}