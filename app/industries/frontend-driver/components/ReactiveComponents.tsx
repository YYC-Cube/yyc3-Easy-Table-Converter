/**
 * @file 响应式UI组件库
 * @description 提供基于响应式系统的React组件
 * @module industries/frontend-driver/components/ReactiveComponents
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React, { forwardRef } from 'react';
import { Button, TextField, Checkbox, Radio, FormControlLabel, Chip, Tooltip } from '@mui/material';
import { useReactiveSubscribe, useReactiveState, useReactiveComputed } from '../hooks/useReactive';
import { ReactiveState, ComputedState } from '../utils/ReactiveUIManager';
import { deepEquals } from '../utils/ReactiveUtils';

/**
 * 响应式按钮组件
 */
export const ReactiveButton: React.FC<{
  label: string | ReactiveState<string> | ComputedState<string>;
  onClick?: () => void;
  disabled?: boolean | ReactiveState<boolean> | ComputedState<boolean>;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  sx?: any;
}> = ({
  label,
  onClick,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  sx
}) => {
  // 订阅响应式状态
  const labelValue = useReactiveSubscribe(
    typeof label === 'string' ? useReactiveState(label) : label
  );
  
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabledValue}
      sx={sx}
    >
      {labelValue}
    </Button>
  );
};

/**
 * 响应式输入框组件
 */
export const ReactiveTextField = forwardRef<
  HTMLInputElement,
  {
    value: string | ReactiveState<string> | ComputedState<string>;
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: boolean | ReactiveState<boolean> | ComputedState<boolean>;
    helperText?: string | ReactiveState<string> | ComputedState<string>;
    disabled?: boolean | ReactiveState<boolean> | ComputedState<boolean>;
    variant?: 'standard' | 'outlined' | 'filled';
    fullWidth?: boolean;
    multiline?: boolean;
    rows?: number;
    sx?: any;
  }
>(
  ({
    value,
    onChange,
    label,
    placeholder,
    error = false,
    helperText = '',
    disabled = false,
    variant = 'outlined',
    fullWidth = false,
    multiline = false,
    rows = 1,
    sx
  }, ref) => {
    // 处理响应式值
    const reactiveValue = typeof value === 'string' ? useReactiveState(value) : value;
    const valueValue = useReactiveSubscribe(reactiveValue);
    
    // 订阅其他响应式属性
    const errorValue = useReactiveSubscribe(
      typeof error === 'boolean' ? useReactiveState(error) : error
    );
    
    const helperTextValue = useReactiveSubscribe(
      typeof helperText === 'string' ? useReactiveState(helperText) : helperText
    );
    
    const disabledValue = useReactiveSubscribe(
      typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
    );

    // 处理输入变化
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // 更新响应式状态
      if (reactiveValue !== value && typeof (reactiveValue as any).set === 'function') {
        (reactiveValue as any).set(event.target.value);
      }
      
      // 调用自定义onChange
      if (onChange) {
        onChange(event.target.value);
      }
    };

    return (
      <TextField
        ref={ref}
        value={valueValue}
        onChange={handleChange}
        label={label}
        {...(placeholder !== undefined && { placeholder })}
        error={errorValue}
        helperText={helperTextValue}
        disabled={disabledValue}
        variant={variant}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        sx={sx}
      />
    );
  }
);
ReactiveTextField.displayName = 'ReactiveTextField';

/**
 * 响应式复选框组件
 */
export const ReactiveCheckbox: React.FC<{
  checked: boolean | ReactiveState<boolean> | ComputedState<boolean>;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean | ReactiveState<boolean> | ComputedState<boolean>;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  sx?: any;
}> = ({
  checked,
  onChange,
  label,
  disabled = false,
  color = 'primary',
  sx
}) => {
  // 处理响应式值
  const reactiveChecked = typeof checked === 'boolean' ? useReactiveState(checked) : checked;
  const checkedValue = useReactiveSubscribe(reactiveChecked);
  
  // 订阅其他响应式属性
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  // 处理变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    
    // 更新响应式状态
    if (reactiveChecked !== checked && typeof (reactiveChecked as any).set === 'function') {
      (reactiveChecked as any).set(newChecked);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checkedValue}
          onChange={handleChange}
          disabled={disabledValue}
          color={color}
          sx={sx}
        />
      }
      label={label}
    />
  );
};

/**
 * 响应式单选按钮组件
 */
export const ReactiveRadio: React.FC<{
  value: string | number;
  selected: string | number | ReactiveState<string | number> | ComputedState<string | number>;
  onChange?: (value: string | number) => void;
  label?: string;
  disabled?: boolean | ReactiveState<boolean> | ComputedState<boolean>;
  color?: 'default' | 'primary' | 'secondary';
  sx?: any;
}> = ({
  value,
  selected,
  onChange,
  label,
  disabled = false,
  color = 'primary',
  sx
}) => {
  // 订阅响应式状态
  const selectedValue = useReactiveSubscribe(
    typeof selected === 'object' ? selected : useReactiveState(selected)
  );
  
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  // 处理选择变化
  const handleChange = () => {
    // 更新响应式状态
    if (typeof selected === 'object' && typeof (selected as any).set === 'function') {
      (selected as any).set(value);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <FormControlLabel
      control={
        <Radio
          checked={selectedValue === value}
          onChange={handleChange}
          value={value}
          disabled={disabledValue}
          color={color}
          sx={sx}
        />
      }
      label={label}
    />
  );
};

/**
 * 响应式复选框组组件
 */
export const ReactiveCheckboxGroup: React.FC<{
  options: Array<{ label: string; value: string | number }>;
  value: Array<string | number> | ReactiveState<Array<string | number>>;
  onChange?: (values: Array<string | number>) => void;
  disabled?: boolean | ReactiveState<boolean>;
  orientation?: 'vertical' | 'horizontal';
}> = ({
  options,
  value,
  onChange,
  disabled = false,
  orientation = 'vertical'
}) => {
  // 处理响应式值
  const reactiveValue = Array.isArray(value) ? useReactiveState(value, { equals: deepEquals }) : value;
  const valueValue = useReactiveSubscribe(reactiveValue);
  
  // 订阅其他响应式属性
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  // 处理单个复选框变化
  const handleChange = (optionValue: string | number, checked: boolean) => {
    const newValue = checked 
      ? [...valueValue, optionValue]
      : valueValue.filter(v => v !== optionValue);
    
    // 更新响应式状态
    if (reactiveValue !== value && typeof (reactiveValue as any).set === 'function') {
      (reactiveValue as any).set(newValue);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: orientation === 'vertical' ? 'flex' : 'inline-flex', flexDirection: 'column' }}>
      {options.map((option) => (
        <ReactiveCheckbox
          key={option.value}
          label={option.label}
          checked={valueValue.includes(option.value)}
          onChange={(checked) => handleChange(option.value, checked)}
          disabled={disabledValue}
        />
      ))}
    </div>
  );
};

/**
 * 响应式单选按钮组组件
 */
export const ReactiveRadioGroup: React.FC<{
  options: Array<{ label: string; value: string | number }>;
  value: string | number | ReactiveState<string | number>;
  onChange?: (value: string | number) => void;
  disabled?: boolean | ReactiveState<boolean>;
  orientation?: 'vertical' | 'horizontal';
}> = ({
  options,
  value,
  onChange,
  disabled = false,
  orientation = 'vertical'
}) => {
  // 处理响应式值
  const reactiveValue = typeof value === 'object' ? value : useReactiveState(value);
  
  // 订阅其他响应式属性
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  return (
    <div style={{ display: orientation === 'vertical' ? 'flex' : 'inline-flex', flexDirection: 'column' }}>
      {options.map((option) => (
        <ReactiveRadio
          key={option.value}
          label={option.label}
          value={option.value}
          selected={reactiveValue}
          {...(onChange && { onChange })}
          disabled={disabledValue}
        />
      ))}
    </div>
  );
};

/**
 * 响应式标签组件
 */
export const ReactiveChip: React.FC<{
  label: string | ReactiveState<string> | ComputedState<string>;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  variant?: 'filled' | 'outlined';
  onDelete?: () => void;
  disabled?: boolean | ReactiveState<boolean>;
  size?: 'small' | 'medium';
  sx?: any;
}> = ({
  label,
  color = 'primary',
  variant = 'filled',
  onDelete,
  disabled = false,
  size = 'medium',
  sx
}) => {
  // 订阅响应式状态
  const labelValue = useReactiveSubscribe(
    typeof label === 'string' ? useReactiveState(label) : label
  );
  
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  return (
    <Chip
      label={labelValue}
      color={color}
      variant={variant}
      {...(onDelete && !disabledValue ? { onDelete: () => onDelete() } : {})}
      disabled={disabledValue}
      size={size}
      sx={sx}
    />
  );
};

/**
 * 响应式标签组组件
 */
export const ReactiveChipGroup: React.FC<{
  items: Array<{ id: string | number; label: string }> | ReactiveState<Array<{ id: string | number; label: string }>>;
  selected: Array<string | number> | ReactiveState<Array<string | number>>;
  onChange?: (selected: Array<string | number>) => void;
  disabled?: boolean | ReactiveState<boolean>;
  color?: 'primary' | 'secondary';
  allowMultiple?: boolean;
}> = ({
  items,
  selected,
  onChange,
  disabled = false,
  color = 'primary',
  allowMultiple = true
}) => {
  // 订阅响应式状态
  const itemsValue = useReactiveSubscribe(
    Array.isArray(items) ? useReactiveState(items, { equals: deepEquals }) : items
  );
  
  const selectedValue = useReactiveSubscribe(
    Array.isArray(selected) ? useReactiveState(selected, { equals: deepEquals }) : selected
  );
  
  const disabledValue = useReactiveSubscribe(
    typeof disabled === 'boolean' ? useReactiveState(disabled) : disabled
  );

  // 处理选择变化
  const handleToggle = (id: string | number) => {
    let newValue: Array<string | number>;
    
    if (selectedValue.includes(id)) {
      // 取消选择
      newValue = selectedValue.filter(item => item !== id);
    } else {
      // 添加选择
      if (allowMultiple) {
        newValue = [...selectedValue, id];
      } else {
        newValue = [id];
      }
    }
    
    // 更新响应式状态
    if (typeof selected === 'object' && !Array.isArray(selected) && typeof (selected as any).set === 'function') {
      (selected as any).set(newValue);
    } else if (typeof selected === 'object' && !Array.isArray(selected) && typeof (selected as any).update === 'function') {
      (selected as any).update(() => newValue);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {itemsValue.map((item) => {
        const isSelected = selectedValue.includes(item.id);
        
        return (
          <Chip
            key={item.id}
            label={item.label}
            color={isSelected ? color : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => !disabledValue && handleToggle(item.id)}
            disabled={disabledValue}
            sx={{
              cursor: disabledValue ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: isSelected ? undefined : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * 响应式工具提示组件
 */
export const ReactiveTooltip: React.FC<{
  title: string | ReactiveState<string> | ComputedState<string>;
  children: React.ReactNode;
  arrow?: boolean;
  placement?: 'bottom-end' | 'bottom-start' | 'bottom' | 'left-end' | 'left-start' | 'left' | 'right-end' | 'right-start' | 'right' | 'top-end' | 'top-start' | 'top';
  sx?: any;
}> = ({
  title,
  children,
  arrow = true,
  placement = 'top',
  sx
}) => {
  // 订阅响应式状态
  const titleValue = useReactiveSubscribe(
    typeof title === 'string' ? useReactiveState(title) : title
  );

  return (
    <Tooltip title={titleValue} arrow={arrow} placement={placement} sx={sx}>
      <>{children}</>
    </Tooltip>
  );
};

/**
 * 响应式计数器组件
 */
export const ReactiveCounter: React.FC<{
  value: number | ReactiveState<number> | ComputedState<number>;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'small' | 'medium';
  sx?: any;
}> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  size = 'medium',
  sx
}) => {
  // 处理响应式值
  const reactiveValue = typeof value === 'number' ? useReactiveState(value) : value;
  const valueValue = useReactiveSubscribe(reactiveValue);

  // 计算按钮状态
  const canDecrease = useReactiveComputed(() => valueValue > min, [valueValue, min]);
  const canIncrease = useReactiveComputed(() => valueValue < max, [valueValue, max]);

  // 处理增减
  const handleDecrease = () => {
    const newValue = Math.max(min, valueValue - step);
    
    // 更新响应式状态
    if (reactiveValue !== value && typeof (reactiveValue as any).set === 'function') {
      (reactiveValue as any).set(newValue);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, valueValue + step);
    
    // 更新响应式状态
    if (reactiveValue !== value && typeof (reactiveValue as any).set === 'function') {
      (reactiveValue as any).set(newValue);
    }
    
    // 调用自定义onChange
    if (onChange) {
      onChange(newValue);
    }
  };

  const buttonSize = size === 'small' ? 'small' : 'medium';
  const buttonSx = {
    minWidth: '32px',
    width: size === 'small' ? '32px' : '40px',
    height: size === 'small' ? '32px' : '40px',
    padding: 0,
    ...sx?.button
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Button
        variant="outlined"
        size={buttonSize}
        onClick={handleDecrease}
        disabled={!canDecrease.value}
        sx={buttonSx}
      >
        −
      </Button>
      
      <div 
        style={{
          margin: '0 8px',
          minWidth: '32px',
          textAlign: 'center',
          fontSize: size === 'small' ? '0.875rem' : '1rem',
          ...sx?.value
        }}
      >
        {valueValue}
      </div>
      
      <Button
        variant="outlined"
        size={buttonSize}
        onClick={handleIncrease}
        disabled={!canIncrease.value}
        sx={buttonSx}
      >
        +
      </Button>
    </div>
  );
};

/**
 * 响应式进度指示器组件
 */
export const ReactiveProgress: React.FC<{
  value: number | ReactiveState<number> | ComputedState<number>;
  min?: number;
  max?: number;
  showValue?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  sx?: any;
}> = ({
  value,
  min = 0,
  max = 100,
  showValue = false,
  height = 8,
  color = 'primary.main',
  backgroundColor = 'divider',
  borderRadius = 4,
  sx
}) => {
  // 订阅响应式状态
  const valueValue = useReactiveSubscribe(
    typeof value === 'number' ? useReactiveState(value) : value
  );

  // 计算百分比
  const percentage = useReactiveComputed(() => {
    const clamped = Math.max(min, Math.min(max, valueValue));
    return ((clamped - min) / (max - min)) * 100;
  }, [valueValue, min, max]);

  return (
    <div style={{ position: 'relative', ...sx }}>
      <div
        style={{
          height: height,
          backgroundColor: backgroundColor,
          borderRadius: borderRadius
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage.value}%`,
            backgroundColor: color,
            borderRadius: borderRadius,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      
      {showValue && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {Math.round(percentage.value)}%
        </div>
      )}
    </div>
  );
};

/**
 * 响应式条件渲染组件
 */
export const ReactiveIf: React.FC<{
  condition: boolean | ReactiveState<boolean> | ComputedState<boolean>;
  children: React.ReactNode;
  else?: React.ReactNode;
}> = ({ condition, children, else: elseContent }) => {
  // 订阅响应式状态
  const conditionValue = useReactiveSubscribe(
    typeof condition === 'boolean' ? useReactiveState(condition) : condition
  );

  return conditionValue ? <>{children}</> : <>{elseContent || null}</>;
};

/**
 * 响应式列表渲染组件
 */
export const ReactiveForEach: React.FC<{
  items: Array<any> | ReactiveState<Array<any>> | ComputedState<Array<any>>;
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any, index: number) => string | number;
  empty?: React.ReactNode;
  separator?: React.ReactNode;
}> = ({ items, renderItem, keyExtractor = (_, index) => index, empty, separator }) => {
  // 订阅响应式状态
  const itemsValue = useReactiveSubscribe(
    Array.isArray(items) ? useReactiveState(items, { equals: deepEquals }) : items
  );

  // 渲染列表项
  return (
    <>
      {itemsValue.length === 0 ? (
        empty || null
      ) : (
        itemsValue.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            {index > 0 && separator}
            {renderItem(item, index)}
          </React.Fragment>
        ))
      )}
    </>
  );
};

/**
 * 响应式表单字段组件
 */
export const ReactiveFormField: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string | null;
  required?: boolean;
  helperText?: string;
  sx?: any;
}> = ({ label, children, error, required = false, helperText, sx }) => {
  return (
    <div style={{ marginBottom: '16px', ...sx }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '4px', 
        fontWeight: 'bold',
        color: error ? 'error.main' : undefined
      }}>
        {label}{required && <span style={{ color: 'error.main' }}> *</span>}
      </label>
      {children}
      {(error || helperText) && (
        <div style={{
          fontSize: '0.75rem',
          color: error ? 'error.main' : 'text.secondary',
          marginTop: '4px'
        }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};