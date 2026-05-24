/**
 * @file 图片编辑器工具函数
 * @description 提供各种图像编辑功能，包括去水印、去文字、橡皮擦、裁剪和添加元素功能
 * @module imageEditor
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * 图片编辑器配置接口
 */
export interface EditorOptions {
  // 橡皮擦配置
  eraser?: {
    size: number;
    shape: 'round' | 'square';
    hardness: number;
  };
  // 裁剪配置
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    shape: 'rect' | 'circle' | 'custom';
  };
  // 文字配置
  text?: {
    content: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
    fontFamily: string;
  };
}

/**
 * 将 ImageData 转换为 Base64 字符串
 * @param imageData Canvas ImageData 对象
 * @param mimeType 输出的 MIME 类型
 * @returns Base64 字符串
 */
export function imageDataToBase64(imageData: ImageData, mimeType: string = 'image/png'): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL(mimeType);
}

/**
 * 从 Base64 字符串创建 ImageData
 * @param base64 Base64 字符串
 * @returns Promise<ImageData>
 */
export function base64ToImageData(base64: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject('无法获取 Canvas 上下文');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject('图片加载失败');
    img.src = base64;
  });
}

/**
 * 复制 ImageData
 * @param source 源 ImageData
 * @returns 复制的 ImageData
 */
export function cloneImageData(source: ImageData): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');
  
  const target = ctx.createImageData(source.width, source.height);
  target.data.set(source.data);
  return target;
}

/**
 * 获取图片像素数据
 * @param canvas Canvas 元素
 * @returns ImageData
 */
export function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 设置 Canvas 图片数据
 * @param canvas Canvas 元素
 * @param imageData 要设置的 ImageData
 */
export function setImageData(canvas: HTMLCanvasElement, imageData: ImageData): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');
  ctx.putImageData(imageData, 0, 0);
}

/**
 * 简单的颜色相似度比较
 * @param color1 颜色1 [r, g, b]
 * @param color2 颜色2 [r, g, b]
 * @returns 相似度分数（0-1，1为完全相同）
 */
export function compareColors(color1: [number, number, number], color2: [number, number, number]): number {
  const diffR = Math.abs(color1[0] - color2[0]);
  const diffG = Math.abs(color1[1] - color2[1]);
  const diffB = Math.abs(color1[2] - color2[2]);
  const maxDiff = 255 * 3;
  return 1 - (diffR + diffG + diffB) / maxDiff;
}

/**
 * 一键去除水印
 * @param input Canvas 元素或 ImageData
 * @param options 去水印选项
 * @returns 处理后的 Canvas 或 ImageData
 */
export function removeWatermark(input: HTMLCanvasElement | ImageData, options?: {
  similarityThreshold?: number;
  fillMethod?: 'average' | 'nearest' | 'bilateral';
}): HTMLCanvasElement | ImageData {
  const { similarityThreshold = 0.9, fillMethod = 'average' } = options || {};
  
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let imageData: ImageData;
  let width: number;
  let height: number;
  
  // 处理不同类型的输入
  if (input instanceof HTMLCanvasElement) {
    canvas = input;
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 Canvas 上下文');
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    width = canvas.width;
    height = canvas.height;
  } else if (input instanceof ImageData) {
    // 如果输入是 ImageData
    imageData = input;
    width = imageData.width;
    height = imageData.height;
    // 创建临时画布用于处理
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取临时 Canvas 上下文');
    ctx.putImageData(imageData, 0, 0);
  } else {
    throw new Error('无效的输入类型，必须是 Canvas 元素或 ImageData');
  }
  
  const data = imageData.data;
  
  // 创建处理后的图像数据副本
  const processedData = new Uint8ClampedArray(data);
  
  // 检测并去除水印的核心算法
  // 1. 首先识别可能的水印区域（基于半透明特性和颜色一致性）
  const watermarkPixels: [number, number][] = [];
  
  for (let y = 0; y < height; y += 2) { // 2步采样提高性能
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      // 检测半透明区域（可能是水印）
      if (alpha > 50 && alpha < 230) {
        // 检查周围像素的颜色一致性
        const isWatermark = checkWatermarkRegion(data, x, y, width, height, similarityThreshold);
        if (isWatermark) {
          watermarkPixels.push([x, y]);
        }
      }
    }
  }
  
  // 2. 对识别到的水印像素进行填充
  watermarkPixels.forEach(([x, y]) => {
    fillWatermarkPixel(processedData, x, y, width, height, fillMethod);
    // 填充相邻像素
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          fillWatermarkPixel(processedData, nx, ny, width, height, fillMethod);
        }
      }
    }
  });
  
  // 3. 应用处理后的数据
  const processedImageData = new ImageData(processedData, width, height);
  
  // 根据输入类型返回相应结果
  if (input instanceof HTMLCanvasElement) {
    ctx.putImageData(processedImageData, 0, 0);
    return canvas;
  } else {
    // 如果输入是 ImageData，直接返回处理后的 ImageData
    return processedImageData;
  }
}

/**
 * 检查区域是否为水印
 */
function checkWatermarkRegion(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, threshold: number): boolean {
  const samplePoints = [
    [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]
  ];
  
  let similarCount = 0;
  const centerIdx = (y * width + x) * 4;
  const centerColor: [number, number, number] = [
    data[centerIdx],
    data[centerIdx + 1],
    data[centerIdx + 2]
  ];
  
  for (const [dx, dy] of samplePoints) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const neighborIdx = (ny * width + nx) * 4;
      const neighborColor: [number, number, number] = [
        data[neighborIdx],
        data[neighborIdx + 1],
        data[neighborIdx + 2]
      ];
      
      if (compareColors(centerColor, neighborColor) > threshold) {
        similarCount++;
      }
    }
  }
  
  return similarCount >= 4; // 至少4个相邻像素颜色相似
}

/**
 * 简单的双边滤波
 */
function bilateralFilter(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, spatialSigma: number = 2, colorSigma: number = 30): [number, number, number] {
  let totalWeight = 0;
  let r = 0, g = 0, b = 0;
  const centerIdx = (y * width + x) * 4;
  const centerColor = [
    data[centerIdx],
    data[centerIdx + 1],
    data[centerIdx + 2]
  ];
  
  const kernelSize = Math.floor(2 * spatialSigma);
  
  for (let ky = -kernelSize; ky <= kernelSize; ky++) {
    for (let kx = -kernelSize; kx <= kernelSize; kx++) {
      const nx = x + kx;
      const ny = y + ky;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIdx = (ny * width + nx) * 4;
        const neighborColor = [
          data[neighborIdx],
          data[neighborIdx + 1],
          data[neighborIdx + 2]
        ];
        
        // 计算空间距离权重
        const spatialWeight = Math.exp(-(kx * kx + ky * ky) / (2 * spatialSigma * spatialSigma));
        
        // 计算颜色距离权重
        const colorDist = Math.sqrt(
          Math.pow(centerColor[0] - neighborColor[0], 2) +
          Math.pow(centerColor[1] - neighborColor[1], 2) +
          Math.pow(centerColor[2] - neighborColor[2], 2)
        );
        const colorWeight = Math.exp(-colorDist * colorDist / (2 * colorSigma * colorSigma));
        
        // 总权重
        const weight = spatialWeight * colorWeight;
        
        r += data[neighborIdx] * weight;
        g += data[neighborIdx + 1] * weight;
        b += data[neighborIdx + 2] * weight;
        totalWeight += weight;
      }
    }
  }
  
  if (totalWeight > 0) {
    return [
      Math.round(r / totalWeight),
      Math.round(g / totalWeight),
      Math.round(b / totalWeight)
    ];
  }
  
  return [centerColor[0], centerColor[1], centerColor[2]];
}

/**
 * 填充水印像素
 */
function fillWatermarkPixel(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, method: 'average' | 'nearest' | 'bilateral'): void {
  const idx = (y * width + x) * 4;
  
  if (method === 'average') {
    // 使用邻域平均颜色填充
    const neighbors = getNeighborPixels(data, x, y, width, height, 3);
    if (neighbors.length > 0) {
      const avgColor = calculateAverageColor(neighbors);
      data[idx] = avgColor[0];     // R
      data[idx + 1] = avgColor[1]; // G
      data[idx + 2] = avgColor[2]; // B
    }
  } else if (method === 'nearest') {
    // 使用最近的非水印像素颜色
    const nearestColor = findNearestNonWatermarkColor(data, x, y, width, height);
    if (nearestColor) {
      data[idx] = nearestColor[0];     // R
      data[idx + 1] = nearestColor[1]; // G
      data[idx + 2] = nearestColor[2]; // B
    }
  } else if (method === 'bilateral') {
    // 简单的双边滤波填充（保留边缘）
    const bilateralColor = applyBilateralFilter(data, x, y, width, height, 5, 15, 30);
    if (bilateralColor) {
      data[idx] = bilateralColor[0];     // R
      data[idx + 1] = bilateralColor[1]; // G
      data[idx + 2] = bilateralColor[2]; // B
    }
  }
}

/**
 * 获取邻域像素
 */
function getNeighborPixels(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, radius: number): [number, number, number][] {
  const neighbors: [number, number, number][] = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = (ny * width + nx) * 4;
        neighbors.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
  }
  
  return neighbors;
}

/**
 * 计算平均颜色
 */
function calculateAverageColor(colors: [number, number, number][]): [number, number, number] {
  let sumR = 0, sumG = 0, sumB = 0;
  
  for (const [r, g, b] of colors) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  
  const count = colors.length;
  return [
    Math.round(sumR / count),
    Math.round(sumG / count),
    Math.round(sumB / count)
  ];
}

/**
 * 寻找最近的非水印颜色
 */
function findNearestNonWatermarkColor(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, maxDistance: number = 20): [number, number, number] | null {
  for (let d = 1; d <= maxDistance; d++) {
    // 环形搜索
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const nx = Math.round(x + d * Math.cos(angle));
      const ny = Math.round(y + d * Math.sin(angle));
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = (ny * width + nx) * 4;
        const alpha = data[idx + 3];
        
        // 认为不透明的像素更可能是非水印
        if (alpha > 240) {
          return [data[idx], data[idx + 1], data[idx + 2]];
        }
      }
    }
  }
  
  return null;
}

// 裁剪相关类型定义
export interface CropOptions {
  x: number
  y: number
  width: number
  height: number
  shape?: 'rectangle' | 'circle' | 'rounded' | 'triangle'
  radius?: number // 用于圆角矩形
}

/**
 * 文本元素配置
 */
export interface TextElement {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  fontWeight: string;
  id: string;
}

/**
 * 图标或表情配置
 */
export interface GraphicElement {
  type: 'icon' | 'emoji';
  content: string; // 图标名称或emoji字符
  x: number;
  y: number;
  size: number;
  id: string;
}

/**
 * 添加文本到图像
 * @param imageData 输入图像数据
 * @param canvas Canvas元素（用于获取上下文绘制文本）
 * @param textElement 文本元素配置
 * @returns 更新后的图像数据
 */
export function addTextToImage(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  textElement: TextElement
): ImageData {
  // 创建临时canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }
  
  // 绘制原始图像
  ctx.putImageData(imageData, 0, 0);
  
  // 设置文本样式
  ctx.font = `${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
  ctx.fillStyle = textElement.fontColor;
  ctx.textBaseline = 'top';
  
  // 绘制文本
  ctx.fillText(textElement.text, textElement.x, textElement.y);
  
  // 返回新的图像数据
  return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
}

/**
 * 添加图标或表情到图像
 * @param imageData 输入图像数据
 * @param canvas Canvas元素
 * @param graphicElement 图形元素配置
 * @returns 更新后的图像数据
 */
export function addGraphicToImage(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  graphicElement: GraphicElement
): ImageData {
  // 创建临时canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }
  
  // 绘制原始图像
  ctx.putImageData(imageData, 0, 0);
  
  // 设置样式
  ctx.font = `${graphicElement.size}px Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  // 绘制图形
  ctx.fillText(graphicElement.content, graphicElement.x, graphicElement.y);
  
  // 返回新的图像数据
  return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
}

/**
 * 移动图像上的元素
 * @param imageData 输入图像数据
 * @param canvas Canvas元素
 * @param elements 所有元素列表
 * @param elementId 要移动的元素ID
 * @param newX 新的X坐标
 * @param newY 新的Y坐标
 * @returns 更新后的图像数据
 */
export function moveElement(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  elements: (TextElement | GraphicElement)[],
  elementId: string,
  newX: number,
  newY: number
): ImageData {
  // 找到要移动的元素
  const elementIndex = elements.findIndex(el => el.id === elementId);
  if (elementIndex === -1) {
    return imageData; // 未找到元素，返回原始数据
  }
  
  // 更新元素位置
  const updatedElements = [...elements];
  updatedElements[elementIndex] = {
    ...updatedElements[elementIndex],
    x: newX,
    y: newY
  };
  
  // 重新绘制所有元素
  return redrawAllElements(imageData, canvas, updatedElements);
}

/**
 * 删除图像上的元素
 * @param imageData 输入图像数据
 * @param canvas Canvas元素
 * @param elements 所有元素列表
 * @param elementId 要删除的元素ID
 * @returns 更新后的图像数据和元素列表
 */
export function removeElement(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  elements: (TextElement | GraphicElement)[],
  elementId: string
): { imageData: ImageData; elements: (TextElement | GraphicElement)[] } {
  // 过滤掉要删除的元素
  const updatedElements = elements.filter(el => el.id !== elementId);
  
  // 重新绘制所有元素
  const newImageData = redrawAllElements(imageData, canvas, updatedElements);
  
  return { imageData: newImageData, elements: updatedElements };
}

/**
 * 重新绘制所有元素
 * @param baseImageData 基础图像数据
 * @param canvas Canvas元素
 * @param elements 所有元素列表
 * @returns 更新后的图像数据
 */
function redrawAllElements(
  baseImageData: ImageData,
  canvas: HTMLCanvasElement,
  elements: (TextElement | GraphicElement)[]
): ImageData {
  // 创建临时canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = baseImageData.width;
  tempCanvas.height = baseImageData.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }
  
  // 绘制基础图像
  ctx.putImageData(baseImageData, 0, 0);
  
  // 绘制所有文本元素
  const textElements = elements.filter(el => 'text' in el);
  textElements.forEach(element => {
    ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.fontColor;
    ctx.textBaseline = 'top';
    ctx.fillText(element.text, element.x, element.y);
  });
  
  // 绘制所有图形元素
  const graphicElements = elements.filter(el => 'type' in el);
  graphicElements.forEach(element => {
    ctx.font = `${element.size}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(element.content, element.x, element.y);
  });
  
  // 返回新的图像数据
  return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
}

/**
 * 裁剪图片函数
 * @param imageData 输入的图像数据
 * @param options 裁剪选项
 * @returns 裁剪后的图像数据
 */
export function cropImage(imageData: ImageData, options: CropOptions): ImageData {
  const { x, y, width, height, shape = 'rectangle', radius = 0 } = options
  
  // 验证裁剪参数
  if (width <= 0 || height <= 0) {
    throw new Error('裁剪尺寸必须为正数')
  }
  
  if (x < 0 || y < 0 || x + width > imageData.width || y + height > imageData.height) {
    throw new Error('裁剪区域超出图像范围')
  }
  
  // 创建裁剪后的画布
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('无法创建画布上下文')
  }
  
  // 将原始图像绘制到临时画布上
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = imageData.width
  tempCanvas.height = imageData.height
  const tempCtx = tempCanvas.getContext('2d')
  
  if (!tempCtx) {
    throw new Error('无法创建临时画布上下文')
  }
  
  tempCtx.putImageData(imageData, 0, 0)
  
  // 根据形状进行裁剪
  if (shape === 'rectangle') {
    // 简单矩形裁剪
    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height)
  } else if (shape === 'circle') {
    // 圆形裁剪
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height)
  } else if (shape === 'rounded') {
    // 圆角矩形裁剪
    const realRadius = Math.min(radius, width / 2, height / 2)
    
    ctx.beginPath()
    ctx.moveTo(realRadius, 0)
    ctx.lineTo(width - realRadius, 0)
    ctx.quadraticCurveTo(width, 0, width, realRadius)
    ctx.lineTo(width, height - realRadius)
    ctx.quadraticCurveTo(width, height, width - realRadius, height)
    ctx.lineTo(realRadius, height)
    ctx.quadraticCurveTo(0, height, 0, height - realRadius)
    ctx.lineTo(0, realRadius)
    ctx.quadraticCurveTo(0, 0, realRadius, 0)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height)
  } else if (shape === 'triangle') {
    // 三角形裁剪
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height)
  }
  
  // 获取裁剪后的图像数据
  return ctx.getImageData(0, 0, width, height)
}

/**
 * 模型裁剪 - 智能识别并裁剪主体
 * @param imageData 输入的图像数据
 * @returns 裁剪后的图像数据（默认矩形裁剪）
 */
export function modelCrop(imageData: ImageData): ImageData {
  // 这里实现一个简单的模型裁剪算法
  // 在实际应用中，可以使用更复杂的算法或AI模型来识别主体
  
  const { width, height, data } = imageData
  
  // 简单实现：找到非透明区域的边界
  // 注意：这里假设图像是有透明背景的PNG或WebP
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  
  // 查找边界
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha > 50) { // 忽略几乎透明的像素
      const pixelIndex = i / 4
      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)
      
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  
  // 如果没有找到非透明像素，返回原始图像
  if (minX > maxX || minY > maxY) {
    return imageData
  }
  
  // 添加一些边距（10%）
  const marginX = Math.floor((maxX - minX) * 0.1)
  const marginY = Math.floor((maxY - minY) * 0.1)
  
  const cropX = Math.max(0, minX - marginX)
  const cropY = Math.max(0, minY - marginY)
  const cropWidth = Math.min(width - cropX, maxX - minX + marginX * 2)
  const cropHeight = Math.min(height - cropY, maxY - minY + marginY * 2)
  
  // 调用普通裁剪函数
  return cropImage(imageData, {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
    shape: 'rectangle'
  })
}

/**
 * 比例裁剪 - 按照指定比例裁剪
 * @param imageData 输入的图像数据
 * @param ratio 裁剪比例，例如 1:1、4:3、16:9 等
 * @returns 裁剪后的图像数据
 */
export function ratioCrop(imageData: ImageData, ratio: string): ImageData {
  const { width: imageWidth, height: imageHeight } = imageData
  
  // 解析比例
  const [widthRatio, heightRatio] = ratio.split(':').map(Number)
  if (isNaN(widthRatio) || isNaN(heightRatio) || widthRatio <= 0 || heightRatio <= 0) {
    throw new Error('无效的比例格式')
  }
  
  const targetRatio = widthRatio / heightRatio
  const currentRatio = imageWidth / imageHeight
  
  let cropWidth, cropHeight, cropX, cropY
  
  if (currentRatio > targetRatio) {
    // 图像较宽，以高度为基准
    cropHeight = imageHeight
    cropWidth = Math.round(imageHeight * targetRatio)
    cropX = Math.floor((imageWidth - cropWidth) / 2)
    cropY = 0
  } else {
    // 图像较高，以宽度为基准
    cropWidth = imageWidth
    cropHeight = Math.round(imageWidth / targetRatio)
    cropX = 0
    cropY = Math.floor((imageHeight - cropHeight) / 2)
  }
  
  // 确保裁剪区域有效
  cropWidth = Math.min(cropWidth, imageWidth)
  cropHeight = Math.min(cropHeight, imageHeight)
  
  return cropImage(imageData, {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
    shape: 'rectangle'
  })
}

/**
 * 橡皮擦工具配置
 */
export interface EraserConfig {
  size: number;
  shape: 'circle' | 'square';
  brushType: 'normal' | 'soft';
  opacity: number;
}

/**
 * 应用橡皮擦到图片数据
 */
export function applyEraser(
  imageData: ImageData,
  x: number,
  y: number,
  config: EraserConfig
): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const size = config.size;
  const shape = config.shape;
  const brushType = config.brushType;
  const opacity = config.opacity;
  
  // 计算擦除区域
  const startX = Math.max(0, x - size / 2);
  const endX = Math.min(width, x + size / 2);
  const startY = Math.max(0, y - size / 2);
  const endY = Math.min(height, y + size / 2);
  
  // 应用橡皮擦
  for (let iy = startY; iy < endY; iy++) {
    for (let ix = startX; ix < endX; ix++) {
      let shouldErase = false;
      let eraseOpacity = opacity;
      
      if (shape === 'circle') {
        // 圆形橡皮擦
        const dx = ix - x;
        const dy = iy - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= size / 2) {
          shouldErase = true;
          
          // 软边笔刷效果
          if (brushType === 'soft') {
            const normalizedDistance = distance / (size / 2);
            eraseOpacity = opacity * (1 - normalizedDistance);
          }
        }
      } else {
        // 方形橡皮擦
        shouldErase = true;
        
        // 软边笔刷效果 - 在边缘渐变
        if (brushType === 'soft') {
          const edgeDistance = Math.min(
            ix - startX,
            endX - ix,
            iy - startY,
            endY - iy
          );
          const softEdgeSize = Math.max(1, size * 0.1);
          const normalizedEdgeDistance = Math.min(1, edgeDistance / softEdgeSize);
          eraseOpacity = opacity * normalizedEdgeDistance;
        }
      }
      
      if (shouldErase) {
        const index = (iy * width + ix) * 4;
        // 降低透明度
        data[index + 3] = Math.max(0, data[index + 3] * (1 - eraseOpacity));
      }
    }
  }
}

/**
 * 一键去除文字
 * @param input Canvas 元素或 ImageData
 * @param options 去文字选项
 * @returns 处理后的 Canvas 或 ImageData
 */
export function removeText(input: HTMLCanvasElement | ImageData, options?: {
  sensitivity?: number;
  minTextSize?: number;
  maxTextSize?: number;
  fillMethod?: 'average' | 'nearest' | 'bilateral';
}): HTMLCanvasElement | ImageData {
  const { 
    sensitivity = 0.5, 
    minTextSize = 10, 
    maxTextSize = 200,
    fillMethod = 'bilateral' 
  } = options || {};
  
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let imageData: ImageData;
  let width: number;
  let height: number;
  
  // 处理不同类型的输入
  if (input instanceof HTMLCanvasElement) {
    canvas = input;
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 Canvas 上下文');
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    width = canvas.width;
    height = canvas.height;
  } else if (input instanceof ImageData) {
    // 如果输入是 ImageData
    imageData = input;
    width = imageData.width;
    height = imageData.height;
    // 创建临时画布用于处理
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取临时 Canvas 上下文');
    ctx.putImageData(imageData, 0, 0);
  } else {
    throw new Error('无效的输入类型，必须是 Canvas 元素或 ImageData');
  }
  
  const data = imageData.data;
  
  // 创建处理后的图像数据副本
  const processedData = new Uint8ClampedArray(data);
  
  // 1. 边缘检测 - 使用简单的 Sobel 算子
  const edges = detectEdges(data, width, height, sensitivity);
  
  // 2. 连通区域分析，找出可能的文字区域
  const textRegions = findTextRegions(edges, width, height, minTextSize, maxTextSize);
  
  // 3. 对识别到的文字区域进行填充
  fillTextRegions(processedData, textRegions, width, height, fillMethod);
  
  // 4. 应用处理后的数据
  const processedImageData = new ImageData(processedData, width, height);
  
  // 根据输入类型返回相应结果
  if (input instanceof HTMLCanvasElement) {
    ctx.putImageData(processedImageData, 0, 0);
    return canvas;
  } else {
    return processedImageData;
  }
}

/**
 * 边缘检测
 */
function detectEdges(data: Uint8ClampedArray, width: number, height: number, threshold: number): boolean[][] {
  const edges: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));
  const grayScale = new Float32Array(width * height);
  
  // 转换为灰度图
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    grayScale[idx] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
  }
  
  // Sobel 算子
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // 应用卷积核
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          const idx = ny * width + nx;
          
          gx += grayScale[idx] * sobelX[ky + 1][kx + 1];
          gy += grayScale[idx] * sobelY[ky + 1][kx + 1];
        }
      }
      
      // 计算梯度幅值
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y][x] = magnitude > threshold;
    }
  }
  
  return edges;
}

/**
 * 寻找文字区域
 */
function findTextRegions(edges: boolean[][], width: number, height: number, minSize: number, maxSize: number): {x: number, y: number, width: number, height: number}[] {
  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  const regions: {x: number, y: number, width: number, height: number}[] = [];
  
  // 四连通区域生长
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y][x] && !visited[y][x]) {
        // 开始新的区域生长
        const region = growRegion(edges, visited, x, y, width, height);
        
        // 过滤文字区域 - 基于尺寸和长宽比
        const regionWidth = region.maxX - region.minX + 1;
        const regionHeight = region.maxY - region.minY + 1;
        const aspectRatio = Math.max(regionWidth, regionHeight) / Math.min(regionWidth, regionHeight);
        
        // 文字通常具有一定的长宽比和大小
        if (regionWidth >= minSize && regionHeight >= minSize &&
            regionWidth <= maxSize && regionHeight <= maxSize &&
            aspectRatio < 10) { // 文字不会太狭长
          regions.push({
            x: region.minX,
            y: region.minY,
            width: regionWidth,
            height: regionHeight
          });
        }
      }
    }
  }
  
  return regions;
}

/**
 * 区域生长
 */
function growRegion(edges: boolean[][], visited: boolean[][], startX: number, startY: number, width: number, height: number): {minX: number, maxX: number, minY: number, maxY: number} {
  const queue: [number, number][] = [[startX, startY]];
  visited[startY][startX] = true;
  
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  
  // 四邻域
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    
    // 更新边界
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    // 检查四邻域
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          edges[ny][nx] && !visited[ny][nx]) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * 填充文字区域
 */
function fillTextRegions(data: Uint8ClampedArray, regions: {x: number, y: number, width: number, height: number}[], width: number, height: number, fillMethod: 'average' | 'nearest' | 'bilateral'): void {
  regions.forEach(region => {
    // 扩展区域以确保完全覆盖文字
    const padding = 2;
    const x = Math.max(0, region.x - padding);
    const y = Math.max(0, region.y - padding);
    const w = Math.min(width - x, region.width + padding * 2);
    const h = Math.min(height - y, region.height + padding * 2);
    
    // 对区域内的每个像素进行填充
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        fillWatermarkPixel(data, px, py, width, height, fillMethod);
      }
    }
  });
}

/**
 * 简单的双边滤波
 */
function applyBilateralFilter(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, diameter: number, sigmaSpace: number, sigmaColor: number): [number, number, number] | null {
  const radius = Math.floor(diameter / 2);
  let weightSum = 0;
  let filteredR = 0, filteredG = 0, filteredB = 0;
  
  const centerIdx = (y * width + x) * 4;
  const centerColor: [number, number, number] = [
    data[centerIdx],
    data[centerIdx + 1],
    data[centerIdx + 2]
  ];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = (ny * width + nx) * 4;
        const neighborColor: [number, number, number] = [
          data[idx],
          data[idx + 1],
          data[idx + 2]
        ];
        
        // 空间距离权重
        const spatialDistance = Math.sqrt(dx * dx + dy * dy);
        const spatialWeight = Math.exp(-spatialDistance * spatialDistance / (2 * sigmaSpace * sigmaSpace));
        
        // 颜色相似度权重
        const colorDiff = Math.sqrt(
          Math.pow(neighborColor[0] - centerColor[0], 2) +
          Math.pow(neighborColor[1] - centerColor[1], 2) +
          Math.pow(neighborColor[2] - centerColor[2], 2)
        );
        const colorWeight = Math.exp(-colorDiff * colorDiff / (2 * sigmaColor * sigmaColor));
        
        // 组合权重
        const weight = spatialWeight * colorWeight;
        
        filteredR += neighborColor[0] * weight;
        filteredG += neighborColor[1] * weight;
        filteredB += neighborColor[2] * weight;
        weightSum += weight;
      }
    }
  }
  
  if (weightSum > 0) {
    return [
      Math.round(filteredR / weightSum),
      Math.round(filteredG / weightSum),
      Math.round(filteredB / weightSum)
    ];
  }
  
  return null;
}
