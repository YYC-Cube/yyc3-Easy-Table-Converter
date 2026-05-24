/**
 * @file 转换服务控制器
 * @description 处理表格转换相关的业务逻辑
 * @module controllers/conversionController
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

import { Request, Response } from 'express';
import { ConversionEngine } from '../engine/ConversionEngine';
import { ConversionRequest, ConversionResponse } from '../types';
import { LoggerService } from '../services/LoggerService';

/**
 * 转换控制器类
 */
class ConversionController {
  private conversionEngine: ConversionEngine;
  private logger: LoggerService;

  constructor() {
    this.conversionEngine = new ConversionEngine();
    this.logger = new LoggerService('ConversionController');
  }

  /**
   * 处理文件转换请求
   * @param req Express请求对象
   * @param res Express响应对象
   */
  async convertFile(req: Request, res: Response): Promise<void> {
    try {
      const { fromFormat, toFormat, options } = req.body;
      const fileData = req.file?.buffer;

      if (!fileData) {
        res.status(400).json({
          success: false,
          error: '没有提供文件数据'
        });
        return;
      }

      const conversionRequest: ConversionRequest = {
        sourceFormat: fromFormat,
        targetFormat: toFormat,
        sourceData: fileData,
        options: typeof options === 'string' ? JSON.parse(options) : options
      };

      // 执行转换
      const result: ConversionResponse = await this.conversionEngine.convert(conversionRequest);

      if (result.success && result.data) {
        // 设置响应头
        res.setHeader('Content-Type', this.getContentType(toFormat));
        res.setHeader('Content-Disposition', `attachment; filename=converted.${toFormat.toLowerCase()}`);
        res.setHeader('X-Processing-Time', `${result.stats?.processingTime || 0}ms`);
        res.setHeader('X-Row-Count', `${result.stats?.rowCount || 0}`);
        
        // 发送转换后的数据
        res.send(result.data);
      } else {
        res.status(500).json({
          success: false,
          error: result.error || '转换失败'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error('转换文件失败', { error: errorMessage });
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * 处理内存中的数据转换
   * @param req Express请求对象
   * @param res Express响应对象
   */
  async convertData(req: Request, res: Response): Promise<void> {
    try {
      const { sourceFormat, targetFormat, sourceData, options } = req.body;

      if (!sourceData) {
        res.status(400).json({
          success: false,
          error: '没有提供源数据'
        });
        return;
      }

      const conversionRequest: ConversionRequest = {
        sourceFormat,
        targetFormat,
        sourceData,
        options
      };

      // 执行转换
      const result: ConversionResponse = await this.conversionEngine.convert(conversionRequest);

      // 返回JSON格式的响应
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error('转换数据失败', { error: errorMessage });
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * 验证文件格式和内容
   * @param req Express请求对象
   * @param res Express响应对象
   */
  async validateFile(req: Request, res: Response): Promise<void> {
    try {
      const { format } = req.body;
      const fileData = req.file?.buffer;

      if (!fileData) {
        res.status(400).json({
          success: false,
          error: '没有提供文件数据'
        });
        return;
      }

      // 简单验证文件是否可以被引擎识别和处理
      const isValid = await this.conversionEngine.validateFile(fileData, format);

      if (isValid) {
        res.json({
          success: true,
          message: '文件验证成功',
          format
        });
      } else {
        res.status(400).json({
          success: false,
          error: '文件格式无效或内容损坏'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error('验证文件失败', { error: errorMessage });
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * 获取支持的格式列表
   * @param req Express请求对象
   * @param res Express响应对象
   */
  getSupportedFormats(req: Request, res: Response): void {
    const supportedFormats = this.conversionEngine.getSupportedFormats();
    
    res.json({
      success: true,
      formats: supportedFormats
    });
  }

  /**
   * 获取文件内容类型
   * @param format 文件格式
   * @returns MIME类型
   */
  private getContentType(format: string): string {
    const contentTypeMap: Record<string, string> = {
      'csv': 'text/csv',
      'json': 'application/json',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'xml': 'application/xml',
      'parquet': 'application/octet-stream',
      'arrow': 'application/octet-stream',
      'markdown': 'text/markdown',
      'html': 'text/html',
      'tsv': 'text/tab-separated-values'
    };
    
    return contentTypeMap[format.toLowerCase()] || 'application/octet-stream';
  }
}

// 导出单例实例
export const conversionController = new ConversionController();
