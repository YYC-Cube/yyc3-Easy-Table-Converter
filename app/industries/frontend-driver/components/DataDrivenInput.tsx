/**
 * @file 数据驱动输入框组件
 * @description 支持数据绑定和验证的输入框组件
 * @module industries/frontend-driver/components/DataDrivenInput
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { useDataBinding } from '../hooks/useDataDriven';

interface DataDrivenInputProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'helperText'> {
  /** 绑定的字段名 */
  fieldName: string;
  /** 数据类型泛型 */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  /** 格式化显示值 */
  formatter?: (value: any) => string;
  /** 解析输入值 */
  parser?: (value: string) => any;
}

/**
 * 数据驱动输入框组件
 * 自动绑定到数据模型，并提供验证功能
 */
export function DataDrivenInput({
  fieldName,
  type = 'text',
  formatter,
  parser,
  variant = 'outlined',
  fullWidth = true,
  size = 'medium',
  ...props
}: DataDrivenInputProps) {
  const { value, onChange, errors, hasError, fieldConfig } = useDataBinding(fieldName);
  
  // 格式化显示值
  const displayValue = formatter ? formatter(value) : value;
  
  // 处理输入变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const parsedValue = parser ? parser(inputValue) : inputValue;
    onChange(parsedValue);
  };
  
  // 根据字段配置自动设置属性
  const inputProps = {
    ...props.InputProps,
    'aria-required': fieldConfig?.required || false
  };
  
  return (
    <TextField
      variant={variant}
      fullWidth={fullWidth}
      size={size}
      type={type}
      value={displayValue || ''}
      onChange={handleChange}
      error={hasError}
      helperText={hasError ? errors[0] : undefined}
      InputProps={inputProps}
      label={props.label || fieldConfig?.label}
      placeholder={props.placeholder || fieldConfig?.label || ''}
      disabled={props.disabled || fieldConfig?.meta?.disabled}
      required={!!fieldConfig?.required}
      {...props}
    />
  );
}

export default DataDrivenInput;
