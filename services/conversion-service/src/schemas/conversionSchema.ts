/**
 * @file 转换服务验证模式
 * @description 定义API请求的验证规则
 * @module schemas/conversionSchema
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

import { DataFormat } from '../types';

/**
 * 转换服务验证模式
 */
export const conversionSchema = {
  /**
   * 文件转换请求验证模式
   */
  convert: {
    body: {
      fromFormat: {
        in: ['body'],
        notEmpty: {
          errorMessage: '源格式是必需的'
        },
        isIn: {
          options: [Object.values(DataFormat)],
          errorMessage: '不支持的源格式'
        }
      },
      toFormat: {
        in: ['body'],
        notEmpty: {
          errorMessage: '目标格式是必需的'
        },
        isIn: {
          options: [Object.values(DataFormat)],
          errorMessage: '不支持的目标格式'
        }
      },
      options: {
        in: ['body'],
        optional: true
      }
    }
  },

  /**
   * 内存数据转换请求验证模式
   */
  data: {
    body: {
      sourceFormat: {
        in: ['body'],
        notEmpty: {
          errorMessage: '源格式是必需的'
        },
        isIn: {
          options: [Object.values(DataFormat)],
          errorMessage: '不支持的源格式'
        }
      },
      targetFormat: {
        in: ['body'],
        notEmpty: {
          errorMessage: '目标格式是必需的'
        },
        isIn: {
          options: [Object.values(DataFormat)],
          errorMessage: '不支持的目标格式'
        }
      },
      sourceData: {
        in: ['body'],
        notEmpty: {
          errorMessage: '源数据是必需的'
        }
      },
      options: {
        in: ['body'],
        optional: true
      }
    }
  },

  /**
   * 文件验证请求验证模式
   */
  validate: {
    body: {
      format: {
        in: ['body'],
        notEmpty: {
          errorMessage: '文件格式是必需的'
        },
        isIn: {
          options: [Object.values(DataFormat)],
          errorMessage: '不支持的文件格式'
        }
      }
    }
  }
};
