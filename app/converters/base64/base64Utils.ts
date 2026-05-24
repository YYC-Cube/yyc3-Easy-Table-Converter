/**
 * 编码文本为 Base64
 */
export function encodeTextToBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
}

/**
 * 解码 Base64 为文本
 */
export function decodeBase64ToText(input: string): string {
  return decodeURIComponent(escape(atob(input)))
}

/**
 * 将文件编码为 Base64（带 MIME）
 */
export function encodeFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject("文件读取失败")
    reader.readAsDataURL(file)
  })
}

/**
 * 获取 Base64 字符串的 MIME 类型
 */
export function getBase64MimeType(base64: string): string | null {
  const match = base64.match(/^data:(.*?);base64,/)
  return match ? match[1] : null
}

/**
 * 估算 Base64 字符串的原始大小（单位：字节）
 */
export function estimateBase64Size(base64: string): number {
  const cleaned = base64.replace(/^data:.*;base64,/, "")
  return Math.floor((cleaned.length * 3) / 4)
}

/**
 * 判断是否为图片 Base64
 */
export function isImageBase64(base64: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,/.test(base64)
}
