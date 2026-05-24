/**
 * @file 单位换算工具组件库
 * @description 提供统一的单位换算UI组件和核心功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

// UI组件
import { UnitSelector } from './UnitSelector';
import * as NumberInputComponents from './NumberInput';
import { ResultDisplay } from './ResultDisplay';
import * as PrecisionSelectorComponents from './PrecisionSelector';
import * as SwapUnitsButtonComponents from './SwapUnitsButton';
import { BatchConversionTable } from './BatchConversionTable';

// 核心引擎
import { ConversionEngine, convertUnits, batchConvertUnits } from './ConversionEngine';

// 重新导出所有组件和功能
export { UnitSelector } from './UnitSelector';
export * from './NumberInput';
export { ResultDisplay } from './ResultDisplay';
export * from './PrecisionSelector';
export * from './SwapUnitsButton';
export { BatchConversionTable } from './BatchConversionTable';

// 核心引擎
export { ConversionEngine, convertUnits, batchConvertUnits } from './ConversionEngine';

// 类型
export type { Unit, ConversionResult } from './ConversionEngine';

// 默认导出
const ConverterTools = {
  UnitSelector,
  ...NumberInputComponents,
  ...PrecisionSelectorComponents,
  ...SwapUnitsButtonComponents,
  ResultDisplay,
  BatchConversionTable,
  ConversionEngine,
  convertUnits,
  batchConvertUnits,
};

export default ConverterTools;