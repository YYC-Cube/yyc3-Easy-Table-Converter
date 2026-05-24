/**
 * @file 数值输入组件
 * @description 为单位换算工具提供统一的数值输入界面，支持格式化和验证
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  scientificNotation?: boolean;
  className?: string;
}

/**
 * 增强的数值输入组件
 * 支持范围验证、小数控制、负数和科学记数法
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label = '数值',
  placeholder = '请输入数值',
  error,
  min,
  max,
  allowDecimal = true,
  allowNegative = true,
  scientificNotation = false,
  className = '',
}) => {
  const [touched, setTouched] = useState(false);

  // 验证数值
  const validateNumber = useCallback((input: string): string | null => {
    // 空输入
    if (!input) return null;

    // 构建正则表达式模式
    let pattern = '^';
    
    // 允许负号
    if (allowNegative) {
      pattern += '-?';
    }
    
    // 整数部分
    pattern += '\\d+';
    
    // 小数部分
    if (allowDecimal) {
      pattern += '(\\.\\d+)?';
    }
    
    // 科学记数法部分
    if (scientificNotation) {
      pattern += '([eE]([-+])?\\d+)?';
    }
    
    pattern += '$';
    
    const regex = new RegExp(pattern);
    
    if (!regex.test(input)) {
      return '请输入有效的数值';
    }
    
    // 范围验证
    const numValue = Number(input);
    if (isNaN(numValue)) {
      return '请输入有效的数值';
    }
    
    if (min !== undefined && numValue < min) {
      return `数值不能小于 ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `数值不能大于 ${max}`;
    }
    
    return null;
  }, [allowDecimal, allowNegative, scientificNotation, min, max]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 允许暂时输入无效值，但只在输入有效值时更新父组件
    if (validateNumber(newValue) === null) {
      onChange(newValue);
    }
    
    // 也可以选择更严格的方式，只允许输入有效的中间值
    // 但这可能会影响用户体验
  };

  // 处理失焦事件
  const handleBlur = () => {
    setTouched(true);
    
    // 如果输入无效，清空或重置为上一个有效值
    const validationError = validateNumber(value);
    if (value && validationError) {
      onChange('');
    }
  };

  // 格式化显示的错误信息
  const displayError = touched && validateNumber(value) || error;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Label htmlFor="number-input" className="text-base font-medium text-gray-700">
        {label}
      </Label>
      
      <Input
        id="number-input"
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`
          border-gray-300 
          focus:border-blue-500 
          focus:ring-blue-500 
          ${displayError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        aria-invalid={!!displayError}
      />
      
      {displayError && (
        <Alert variant="destructive" className="py-1 px-2 text-xs">
          <AlertDescription className="text-red-600">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * 预设的整数输入组件
 */
export const IntegerInput: React.FC<Omit<NumberInputProps, 'allowDecimal'>> = (props) => (
  <NumberInput {...props} allowDecimal={false} />
);

/**
 * 预设的正数输入组件
 */
export const PositiveNumberInput: React.FC<Omit<NumberInputProps, 'allowNegative'>> = (props) => (
  <NumberInput {...props} allowNegative={false} />
);

/**
 * 预设的科学记数法输入组件
 */
export const ScientificNumberInput: React.FC<NumberInputProps> = (props) => (
  <NumberInput {...props} scientificNotation={true} />
);

export default NumberInput;