/**
 * @file 颜色工具组件库
 * @description 提供颜色相关的通用UI组件集合
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

// 颜色卡片组件
import ColorCardComponent from './ColorCard';
import ColorPaletteDisplayComponent from './ColorPaletteDisplay';
import ColorPickerComponent from './ColorPicker';
import ContrastCheckerComponent from './ContrastChecker';
import ColorContextComponent, { ColorProvider, useColor } from './ColorContext';

export { default as ColorCard } from './ColorCard';
export type { ColorData } from './ColorCard';
export { default as ColorPaletteDisplay } from './ColorPaletteDisplay';
export { default as ColorPicker } from './ColorPicker';
export { default as ContrastChecker } from './ContrastChecker';
export { default as ColorContext, ColorProvider, useColor } from './ColorContext';

// 导出所有组件作为默认对象
const ColorTools = {
  ColorCard: ColorCardComponent,
  ColorPaletteDisplay: ColorPaletteDisplayComponent,
  ColorPicker: ColorPickerComponent,
  ContrastChecker: ContrastCheckerComponent,
  ColorContext: ColorContextComponent,
  ColorProvider,
  useColor
};

export default ColorTools;