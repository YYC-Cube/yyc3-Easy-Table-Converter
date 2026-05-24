/**
 * @file WebAssembly 模块加载器
 * @description JavaScript与WebAssembly交互的桥接模块
 * @module lib/wasm
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

/**
 * WebAssembly模块接口
 */
interface WasmModule {
  parseCSV: (csv: string) => string;
  countCSVLines: (csv: string) => number;
  detectDataType: (value: string) => number;
  formatNumberWithOptions: (value: string, decimalPlaces: number) => string;
  compressNumberDisplay: (value: string) => string;
}

/**
 * WebAssembly加载器类
 */
export class WasmLoader {
  private static instance: WasmLoader;
  private module: WasmModule | null = null;
  private loadingPromise: Promise<WasmModule> | null = null;
  private isSupported: boolean = false;

  private constructor() {
    // 检测浏览器是否支持WebAssembly
    this.isSupported = typeof WebAssembly !== 'undefined';
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): WasmLoader {
    if (!WasmLoader.instance) {
      WasmLoader.instance = new WasmLoader();
    }
    return WasmLoader.instance;
  }

  /**
   * 加载WebAssembly模块
   * @param wasmPath WebAssembly文件路径
   * @returns Promise<WasmModule>
   */
  public async loadModule(wasmPath: string = '/wasm/data-processor.wasm'): Promise<WasmModule> {
    // 如果不支持WebAssembly，返回JavaScript实现的替代模块
    if (!this.isSupported) {
      console.warn('当前环境不支持WebAssembly，将使用JavaScript回退实现');
      return this.getJavaScriptFallback();
    }

    // 防止重复加载
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // 如果模块已加载，直接返回
    if (this.module) {
      return this.module;
    }

    try {
      // 创建加载Promise
      this.loadingPromise = this.doLoadModule(wasmPath);
      this.module = await this.loadingPromise;
      return this.module;
    } catch (error) {
      console.error('加载WebAssembly模块失败:', error);
      // 加载失败时使用JavaScript回退
      return this.getJavaScriptFallback();
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * 实际执行WebAssembly模块加载
   */
  private async doLoadModule(wasmPath: string): Promise<WasmModule> {
    try {
      // 注意：在实际项目中，需要先编译AssemblyScript代码生成.wasm文件
      // 这里暂时使用JavaScript回退实现，直到.wasm文件可用
      console.info('WebAssembly模块路径:', wasmPath);
      console.info('注意：需要先使用AssemblyScript编译器生成.wasm文件');
      
      // 返回JavaScript实现作为临时替代
      return this.getJavaScriptFallback();
    } catch (error) {
      console.error('WebAssembly模块加载失败:', error);
      throw error;
    }
  }

  /**
   * 获取JavaScript实现的替代模块
   */
  private getJavaScriptFallback(): WasmModule {
    return {
      parseCSV: this.parseCSVJavaScript,
      countCSVLines: this.countCSVLinesJavaScript,
      detectDataType: this.detectDataTypeJavaScript,
      formatNumberWithOptions: this.formatNumberWithOptionsJavaScript,
      compressNumberDisplay: this.compressNumberDisplayJavaScript
    };
  }

  /**
   * JavaScript实现的CSV解析
   */
  private parseCSVJavaScript(csv: string): string {
    try {
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '[]';

      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = index < values.length ? values[index].trim() : '';
        });
        
        data.push(row);
      }

      return JSON.stringify(data);
    } catch (error) {
      console.error('JavaScript CSV解析失败:', error);
      return '[]';
    }
  }

  /**
   * JavaScript实现的CSV行数统计
   */
  private countCSVLinesJavaScript(csv: string): number {
    const lines = csv.split('\n').filter(line => line.trim());
    return lines.length;
  }

  /**
   * JavaScript实现的数据类型检测
   */
  private detectDataTypeJavaScript(value: string): number {
    // 对应DataType枚举
    const DataType = {
      STRING: 0,
      NUMBER: 1,
      INTEGER: 2,
      BOOLEAN: 3,
      DATE: 4,
      NULL: 5
    };

    if (value === '' || value.toLowerCase() === 'null') {
      return DataType.NULL;
    }

    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return DataType.BOOLEAN;
    }

    // 检查整数
    if (/^-?\d+$/.test(value)) {
      return DataType.INTEGER;
    }

    // 检查数字
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return DataType.NUMBER;
    }

    // 简单的日期检查
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return DataType.DATE;
    }

    return DataType.STRING;
  }

  /**
   * JavaScript实现的数字格式化
   */
  private formatNumberWithOptionsJavaScript(value: string, decimalPlaces: number): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    return num.toFixed(decimalPlaces);
  }

  /**
   * JavaScript实现的数字压缩显示
   */
  private compressNumberDisplayJavaScript(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }

    return value;
  }

  /**
   * 检查是否支持WebAssembly
   */
  public checkSupport(): boolean {
    return this.isSupported;
  }
}

export default WasmLoader.getInstance();
