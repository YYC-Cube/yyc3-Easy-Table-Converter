/**
 * @file 图像优化工具
 * @description 提供图像懒加载、预加载和缓存优化功能
 * @module utils/imageOptimization
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

/**
 * 图像缓存项
 */
interface ImageCacheItem {
  url: string;
  blob: Blob;
  timestamp: number;
  usageCount: number;
}

/**
 * 图像优化服务
 */
export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private imageCache: Map<string, ImageCacheItem> = new Map();
  private cacheSizeLimit: number; // 字节
  private maxCacheItems: number;
  private lazyLoadObserver: IntersectionObserver | null = null;
  private lazyLoadImages: Set<HTMLImageElement> = new Set();

  private constructor() {
    // 默认缓存大小：10MB
    this.cacheSizeLimit = 10 * 1024 * 1024;
    this.maxCacheItems = 50;
    this.initLazyLoadObserver();
    this.setupCacheCleanup();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * 初始化懒加载观察器
   */
  private initLazyLoadObserver(): void {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadLazyImage(img);
              this.lazyLoadObserver?.unobserve(img);
              this.lazyLoadImages.delete(img);
            }
          });
        },
        {
          rootMargin: '50px', // 提前50px加载
          threshold: 0.01 // 只要1%的图像可见就开始加载
        }
      );
    }
  }

  /**
   * 设置缓存清理定时器
   */
  private setupCacheCleanup(): void {
    // 每小时清理一次缓存
    setInterval(() => {
      this.cleanupCache();
    }, 3600000);

    // 监听页面卸载事件，清理资源
    window.addEventListener('beforeunload', () => {
      this.cleanupResources();
    });
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // 移除一小时未使用的缓存项
    this.imageCache.forEach((item, key) => {
      if (item.timestamp < oneHourAgo) {
        this.imageCache.delete(key);
      }
    });

    // 如果缓存项数量超过限制，按使用频率和时间排序并移除最旧的
    if (this.imageCache.size > this.maxCacheItems) {
      const sortedItems = Array.from(this.imageCache.entries()).sort((a, b) => {
        // 首先按使用次数排序，然后按时间排序
        if (a[1].usageCount !== b[1].usageCount) {
          return a[1].usageCount - b[1].usageCount;
        }
        return a[1].timestamp - b[1].timestamp;
      });

      // 移除多余的项
      const itemsToRemove = this.imageCache.size - this.maxCacheItems;
      for (let i = 0; i < itemsToRemove; i++) {
        this.imageCache.delete(sortedItems[i][0]);
      }
    }

    // 检查缓存大小是否超过限制
    this.checkCacheSize();
  }

  /**
   * 检查并限制缓存大小
   */
  private checkCacheSize(): void {
    let totalSize = 0;
    const cacheEntries = Array.from(this.imageCache.entries());

    // 计算缓存总大小
    for (const [, item] of cacheEntries) {
      totalSize += item.blob.size;
    }

    // 如果超过限制，移除最旧的缓存项
    if (totalSize > this.cacheSizeLimit) {
      // 按时间排序
      cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (totalSize > this.cacheSizeLimit && cacheEntries.length > 0) {
        const [key, item] = cacheEntries.shift()!;
        this.imageCache.delete(key);
        totalSize -= item.blob.size;
      }
    }
  }

  /**
   * 懒加载单个图像
   */
  private loadLazyImage(img: HTMLImageElement): void {
    const dataSrc = img.getAttribute('data-src');
    const dataSrcSet = img.getAttribute('data-srcset');
    
    if (dataSrc) {
      img.src = dataSrc;
      img.removeAttribute('data-src');
    }
    
    if (dataSrcSet) {
      img.srcset = dataSrcSet;
      img.removeAttribute('data-srcset');
    }
    
    // 触发加载
    img.decode().catch((error) => {
      console.error('图像解码失败:', error, img.src);
    });
  }

  /**
   * 注册懒加载图像
   * @param images 图像元素或选择器
   */
  public registerLazyLoad(images: string | HTMLImageElement | HTMLImageElement[]): void {
    let elements: HTMLImageElement[] = [];
    
    if (typeof images === 'string') {
      elements = Array.from(document.querySelectorAll(images));
    } else if (images instanceof HTMLImageElement) {
      elements = [images];
    } else if (Array.isArray(images)) {
      elements = images;
    }

    elements.forEach((img) => {
      // 只处理带有data-src属性的图像
      if (img.getAttribute('data-src') && !this.lazyLoadImages.has(img)) {
        this.lazyLoadImages.add(img);
        if (this.lazyLoadObserver) {
          this.lazyLoadObserver.observe(img);
        } else {
          // 如果不支持IntersectionObserver，立即加载
          this.loadLazyImage(img);
        }
      }
    });
  }

  /**
   * 预加载图像
   * @param urls 图像URL数组
   * @param priority 是否优先加载
   */
  public async preloadImages(urls: string[], priority: boolean = false): Promise<void> {
    const promises = urls.map(async (url) => {
      // 检查是否已缓存
      if (this.imageCache.has(url)) {
        const cachedItem = this.imageCache.get(url)!;
        cachedItem.timestamp = Date.now();
        cachedItem.usageCount++;
        return;
      }

      try {
        const response = await fetch(url, {
          cache: 'force-cache',
          priority: priority ? 'high' : 'auto'
        });

        if (!response.ok) {
          throw new Error(`无法预加载图像: ${url}, 状态码: ${response.status}`);
        }

        const blob = await response.blob();
        
        // 检查图像类型是否有效
        if (!blob.type.startsWith('image/')) {
          throw new Error(`无效的图像类型: ${blob.type}`);
        }

        // 添加到缓存
        this.imageCache.set(url, {
          url,
          blob,
          timestamp: Date.now(),
          usageCount: 1
        });

        // 创建图像对象以确保浏览器缓存
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        
        // 图像加载完成后释放URL
        img.onload = () => {
          URL.revokeObjectURL(img.src);
        };
      } catch (error) {
        console.warn(`预加载图像失败: ${url}`, error);
      }
    });

    await Promise.all(promises);
    
    // 检查缓存大小
    this.checkCacheSize();
  }

  /**
   * 优化图像加载
   * @param img 图像元素
   * @param options 优化选项
   */
  public optimizeImage(
    img: HTMLImageElement,
    options: { 
      quality?: number; 
      maxWidth?: number; 
      maxHeight?: number;
      lazy?: boolean;
      placeholder?: string;
    } = {}
  ): void {
    const { quality = 0.8, maxWidth, maxHeight, lazy = true, placeholder } = options;

    // 设置占位符
    if (placeholder && img.getAttribute('src') !== placeholder) {
      img.src = placeholder;
    }

    const originalSrc = img.src;
    
    if (lazy) {
      // 启用懒加载
      img.setAttribute('data-src', originalSrc);
      img.removeAttribute('src');
      this.registerLazyLoad(img);
    } else {
      // 非懒加载，直接优化
      this.processImage(img, quality, maxWidth, maxHeight);
    }

    // 添加错误处理
    img.onerror = () => {
      console.error('图像加载失败:', img.src);
      // 可以设置一个备用图像
      const fallbackSrc = img.getAttribute('data-fallback');
      if (fallbackSrc) {
        img.src = fallbackSrc;
      }
    };

    // 添加加载事件处理
    img.onload = () => {
      // 可以在这里添加淡入效果
      img.style.opacity = '1';
    };

    // 初始设置透明度为0，用于淡入效果
    if (!img.style.opacity) {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
    }
  }

  /**
   * 处理图像（调整大小、压缩等）
   */
  private async processImage(
    img: HTMLImageElement,
    quality: number,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<void> {
    const url = img.src;
    
    // 检查缓存
    if (this.imageCache.has(url)) {
      const cachedItem = this.imageCache.get(url)!;
      cachedItem.timestamp = Date.now();
      cachedItem.usageCount++;
      
      // 创建URL并设置
      const objectUrl = URL.createObjectURL(cachedItem.blob);
      img.src = objectUrl;
      
      // 图像加载完成后释放URL
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
      };
      
      return;
    }

    try {
      // 加载原图
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 检查是否需要处理
      if (maxWidth || maxHeight) {
        // 使用Canvas调整大小
        const resizedBlob = await this.resizeImage(blob, maxWidth, maxHeight, quality);
        
        // 缓存处理后的图像
        this.imageCache.set(url, {
          url,
          blob: resizedBlob,
          timestamp: Date.now(),
          usageCount: 1
        });

        // 设置图像源
        const objectUrl = URL.createObjectURL(resizedBlob);
        img.src = objectUrl;
        
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
        };
      } else {
        // 直接缓存原图
        this.imageCache.set(url, {
          url,
          blob,
          timestamp: Date.now(),
          usageCount: 1
        });
      }
    } catch (error) {
      console.error('处理图像失败:', error, url);
    }
  }

  /**
   * 调整图像大小
   */
  private async resizeImage(
    blob: Blob,
    maxWidth?: number,
    maxHeight?: number,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        // 计算新尺寸
        let width = img.width;
        let height = img.height;
        
        if (maxWidth && width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }
        
        if (maxHeight && height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = Math.round(width * ratio);
        }
        
        // 创建Canvas并绘制图像
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob(
          (resizedBlob) => {
            if (resizedBlob) {
              resolve(resizedBlob);
            } else {
              reject(new Error('无法创建调整大小后的图像Blob'));
            }
          },
          blob.type || 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('无法加载图像进行处理'));
      };

      img.src = objectUrl;
    });
  }

  /**
   * 清理资源
   */
  public cleanupResources(): void {
    // 断开懒加载观察器
    if (this.lazyLoadObserver) {
      this.lazyLoadImages.forEach((img) => {
        this.lazyLoadObserver?.unobserve(img);
      });
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }
    
    this.lazyLoadImages.clear();
    
    // 清理缓存中的Blob URL（如果有的话）
    // 注意：这里不清理整个缓存，因为可能其他组件还在使用
  }

  /**
   * 设置缓存大小限制
   * @param sizeInMB 缓存大小（MB）
   */
  public setCacheSizeLimit(sizeInMB: number): void {
    this.cacheSizeLimit = sizeInMB * 1024 * 1024;
    this.checkCacheSize();
  }

  /**
   * 设置最大缓存项数量
   * @param count 最大缓存项数量
   */
  public setMaxCacheItems(count: number): void {
    this.maxCacheItems = count;
    this.cleanupCache();
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    itemCount: number;
    estimatedSizeMB: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    let totalSize = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    this.imageCache.forEach((item) => {
      totalSize += item.blob.size;
      
      if (oldestTimestamp === null || item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
      
      if (newestTimestamp === null || item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
      }
    });

    return {
      itemCount: this.imageCache.size,
      estimatedSizeMB: totalSize / (1024 * 1024),
      oldestTimestamp,
      newestTimestamp
    };
  }
}

// 导出便捷函数

/**
 * 注册懒加载图像
 */
export function registerLazyImages(images: string | HTMLImageElement | HTMLImageElement[]): void {
  ImageOptimizationService.getInstance().registerLazyLoad(images);
}

/**
 * 预加载图像
 */
export async function preloadImages(urls: string[], priority: boolean = false): Promise<void> {
  return ImageOptimizationService.getInstance().preloadImages(urls, priority);
}

/**
 * 优化图像
 */
export function optimizeImage(
  img: HTMLImageElement,
  options?: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    lazy?: boolean;
    placeholder?: string;
  }
): void {
  ImageOptimizationService.getInstance().optimizeImage(img, options);
}

/**
 * 获取缓存统计信息
 */
export function getImageCacheStats() {
  return ImageOptimizationService.getInstance().getCacheStats();
}