/**
 * @file 数据驱动选择器组件
 * @description 支持数据绑定和验证的下拉选择器组件
 * @module industries/frontend-driver/components/DataDrivenSelect
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormHelperText,
  OutlinedInput,
  SelectProps
} from '@mui/material';
import { useDataBinding } from '../hooks/useDataDriven';

interface Option {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DataDrivenSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {
  /** 绑定的字段名 */
  fieldName: string;
  /** 选项列表 */
  options: Option[];
  /** 是否多选 */
  multiple?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 自定义渲染选项 */
  renderOption?: (option: Option) => React.ReactNode;
}

/**
 * 数据驱动选择器组件
 * 自动绑定到数据模型，支持单选和多选
 */
export function DataDrivenSelect({
  fieldName,
  options,
  multiple = false,
  placeholder = '请选择',
  renderOption,
  variant = 'outlined',
  fullWidth = true,
  size = 'medium',
  ...props
}: DataDrivenSelectProps) {
  const { value, onChange, errors, hasError, fieldConfig } = useDataBinding(fieldName);
  
  // 处理选择变化
  const handleChange = (event: SelectChangeEvent<any>) => {
    onChange(event.target.value);
  };
  

  
  // 渲染选项
  const renderMenuItem = (option: Option) => {
    if (renderOption) {
      return (
        <MenuItem 
          key={option.value} 
          value={option.value}
          disabled={!!option.disabled}
        >
          {renderOption(option)}
        </MenuItem>
      );
    }
    
    return (
      <MenuItem 
        key={option.value} 
        value={option.value}
        disabled={!!option.disabled}
      >
        {option.label}
      </MenuItem>
    );
  };
  
  return (
    <FormControl 
      fullWidth={fullWidth}
      variant={variant}
      size={size}
      error={hasError}
      disabled={props.disabled || fieldConfig?.meta?.disabled}
    >
      {!props.label && fieldConfig?.label && (
        <InputLabel id={`${fieldName}-label`}>
          {fieldConfig.label}
        </InputLabel>
      )}
      
      <Select
        labelId={`${fieldName}-label`}
        id={fieldName}
        value={value || ''}
        onChange={handleChange}
        multiple={multiple}
        label={props.label || fieldConfig?.label}
        input={multiple ? (
          <OutlinedInput 
            id={`${fieldName}-outlined-multiple`}
            label={props.label || fieldConfig?.label}
            placeholder={placeholder}
          />
        ) : <OutlinedInput />}
        {...props}
      >
        {options.map(renderMenuItem)}
      </Select>
      
      {hasError && (
        <FormHelperText>{errors[0]}</FormHelperText>
      )}
    </FormControl>
  );
}

export default DataDrivenSelect;
