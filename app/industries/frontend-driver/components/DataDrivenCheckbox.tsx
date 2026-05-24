/**
 * @file 数据驱动复选框组件
 * @description 支持数据绑定和验证的复选框组件
 * @module industries/frontend-driver/components/DataDrivenCheckbox
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React from 'react';
import { FormControlLabel, Checkbox, CheckboxProps } from '@mui/material';
import { useDataBinding } from '../hooks/useDataDriven';

interface DataDrivenCheckboxProps extends Omit<CheckboxProps, 'checked' | 'onChange'> {
  /** 绑定的字段名 */
  fieldName: string;
  /** 标签文本 */
  label: string;
  /** 复选框值（用于多选组） */
  value?: any;
  /** 复选框组配置 */
  group?: boolean;
  /** 反向值（将true/false反转） */
  reverse?: boolean;
}

interface CheckboxOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DataDrivenCheckboxGroupProps {
  /** 绑定的字段名 */
  fieldName: string;
  /** 选项列表 */
  options: CheckboxOption[];
  /** 布局方向 */
  direction?: 'row' | 'column';
  /** 子组件间距 */
  spacing?: number;
  /** 复选框通用属性 */
  checkboxProps?: Omit<CheckboxProps, 'checked' | 'onChange'>;
}

/**
 * 数据驱动复选框组件
 * 支持单个复选框和复选框组
 */
export function DataDrivenCheckbox({
  fieldName,
  label,
  value,
  group = false,
  reverse = false,
  ...props
}: DataDrivenCheckboxProps) {
  const { value: currentData, onChange: updateData } = useDataBinding(fieldName);
  const fieldValue = currentData[fieldName];
  
  // 确定是否选中
  const isChecked = group ? 
    Array.isArray(fieldValue) && fieldValue.includes(value) :
    reverse ? !fieldValue : !!fieldValue;
  
  // 处理变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    
    if (group) {
      // 处理多选组
      const currentValues = Array.isArray(fieldValue) ? [...fieldValue] : [];
      let newValues;
      
      if (checked) {
        // 添加值
        if (!currentValues.includes(value)) {
          newValues = [...currentValues, value];
        } else {
          newValues = currentValues;
        }
      } else {
        // 移除值
        newValues = currentValues.filter(v => v !== value);
      }
      
      updateData(newValues);
    } else {
      // 处理单个复选框
      updateData(reverse ? !checked : checked);
    }
  };
  
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={isChecked}
          onChange={handleChange}
          value={value}
          {...props}
        />
      }
      label={label}
    />
  );
}

/**
 * 数据驱动复选框组组件
 * 用于管理一组复选框
 */
export function DataDrivenCheckboxGroup({
  fieldName,
  options,
  direction = 'row',
  spacing = 2,
  checkboxProps = {}
}: DataDrivenCheckboxGroupProps) {
  const { value: currentData, onChange: updateData, errors, hasError } = useDataBinding(fieldName);
  
  // 处理单个选项变化
  const handleOptionChange = (optionValue: any, checked: boolean) => {
    const currentValues = Array.isArray(currentData[fieldName]) ? [...currentData[fieldName]] : [];
    let newValues;
    
    if (checked) {
      // 添加值
      if (!currentValues.includes(optionValue)) {
        newValues = [...currentValues, optionValue];
      } else {
        newValues = currentValues;
      }
    } else {
      // 移除值
      newValues = currentValues.filter(v => v !== optionValue);
    }
    
    updateData(newValues);
  };
  
  // 确定选项是否选中
  const isOptionChecked = (optionValue: any) => {
    const fieldValue = currentData[fieldName];
    return Array.isArray(fieldValue) && fieldValue.includes(optionValue);
  };
  
  // 计算样式
  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap: `${spacing}px`
  };
  
  return (
    <div style={groupStyle}>
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Checkbox
              checked={isOptionChecked(option.value)}
              onChange={(event) => handleOptionChange(option.value, event.target.checked)}
              value={option.value}
              disabled={!!(option.disabled || checkboxProps.disabled)}
              color={checkboxProps.color || 'default'}
              size={checkboxProps.size || 'medium'}
              {...checkboxProps}
            />
          }
          label={option.label}
          disabled={!!option.disabled}
        />
      ))}
      {hasError && (
        <div className="text-red-500 text-sm mt-2">
          {errors[0]}
        </div>
      )}
    </div>
  );
}

export default DataDrivenCheckbox;
