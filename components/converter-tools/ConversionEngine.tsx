/**
 * @file 转换引擎组件
 * @description 提供统一的单位换算核心逻辑和接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React, { useMemo } from 'react';

// 单位数据接口定义
export interface Unit {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  conversionFactor: number;
  description?: string;
  baseUnit?: boolean;
}

// 转换结果接口
export interface ConversionResult {
  result: string;
  formula?: string;
  error?: string;
}

// 转换引擎属性接口
interface ConversionEngineProps {
  sourceValue: string;
  sourceUnit: Unit | null;
  targetUnit: Unit | null;
  precision?: number;
  children: (result: ConversionResult) => React.ReactNode;
}

/**
 * 转换引擎组件
 * 提供统一的单位换算核心逻辑
 */
export const ConversionEngine: React.FC<ConversionEngineProps> = ({
  sourceValue,
  sourceUnit,
  targetUnit,
  precision = 2,
  children,
}) => {
  // 执行单位换算计算
  const conversionResult = useMemo((): ConversionResult => {
    // 验证输入值
    if (!sourceValue || sourceValue.trim() === '') {
      return { result: '' };
    }

    // 验证单位
    if (!sourceUnit || !targetUnit) {
      return { result: '' };
    }

    try {
      // 解析数值
      const value = parseFloat(sourceValue);
      
      // 检查数值是否有效
      if (isNaN(value)) {
        return {
          result: '',
          error: '请输入有效的数值',
        };
      }

      // 相同单位直接返回
      if (sourceUnit.id === targetUnit.id) {
        const formattedValue = value.toFixed(precision);
        return {
          result: formattedValue,
          formula: `${value} ${sourceUnit.symbol} = ${formattedValue} ${targetUnit.symbol}`,
        };
      }

      // 执行转换计算（基于基准单位）
      // 1. 先转换为基准单位
      // 2. 再从基准单位转换为目标单位
      const valueInBaseUnit = value * sourceUnit.conversionFactor;
      const convertedValue = valueInBaseUnit / targetUnit.conversionFactor;

      // 格式化结果
      const formattedResult = convertedValue.toFixed(precision);
      
      // 生成计算公式说明
      const formula = `${value} ${sourceUnit.symbol} × ${sourceUnit.conversionFactor} ÷ ${targetUnit.conversionFactor} = ${formattedResult} ${targetUnit.symbol}`;

      return {
        result: formattedResult,
        formula,
      };
    } catch (error) {
      console.error('转换计算错误:', error);
      return {
        result: '',
        error: '转换过程中发生错误',
      };
    }
  }, [sourceValue, sourceUnit, targetUnit, precision]);

  return <>{children(conversionResult)}</>;
};

/**
 * 通用转换函数
 * 可在不使用组件的情况下直接调用
 */
export const convertUnits = (
  value: string,
  sourceUnit: Unit | null,
  targetUnit: Unit | null,
  precision: number = 2
): ConversionResult => {
  // 验证输入值
  if (!value || value.trim() === '') {
    return { result: '' };
  }

  // 验证单位
  if (!sourceUnit || !targetUnit) {
    return { result: '' };
  }

  try {
    // 解析数值
    const numValue = parseFloat(value);
    
    // 检查数值是否有效
    if (isNaN(numValue)) {
      return {
        result: '',
        error: '请输入有效的数值',
      };
    }

    // 相同单位直接返回
    if (sourceUnit.id === targetUnit.id) {
      const formattedValue = numValue.toFixed(precision);
      return {
        result: formattedValue,
        formula: `${numValue} ${sourceUnit.symbol} = ${formattedValue} ${targetUnit.symbol}`,
      };
    }

    // 执行转换计算
    const valueInBaseUnit = numValue * sourceUnit.conversionFactor;
    const convertedValue = valueInBaseUnit / targetUnit.conversionFactor;

    // 格式化结果
    const formattedResult = convertedValue.toFixed(precision);
    const formula = `${numValue} ${sourceUnit.symbol} × ${sourceUnit.conversionFactor} ÷ ${targetUnit.conversionFactor} = ${formattedResult} ${targetUnit.symbol}`;

    return {
      result: formattedResult,
      formula,
    };
  } catch (error) {
    console.error('转换计算错误:', error);
    return {
      result: '',
      error: '转换过程中发生错误',
    };
  }
};

/**
 * 批量转换函数
 * 支持多值同时转换
 */
export const batchConvertUnits = (
  values: string[],
  sourceUnit: Unit | null,
  targetUnit: Unit | null,
  precision: number = 2
): ConversionResult[] => {
  return values.map(value => convertUnits(value, sourceUnit, targetUnit, precision));
};

export default ConversionEngine;