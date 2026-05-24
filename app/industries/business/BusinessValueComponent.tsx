/**
 * @file 业务价值评估组件
 * @description 提供投资回报率计算和决策支持效果评估的可视化界面
 * @module business
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BusinessValueEvaluator,
  ROIParameters,
  ROIResult,
  DecisionSupportParameters,
  DecisionSupportResult,
  BusinessValueReport
} from './BusinessValueEvaluator';
import BarChart from '../visualization/charts/BarChart';
import LineChart from '../visualization/charts/LineChart';
import PieChart from '../visualization/charts/PieChart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';


// 投资评级对应的颜色
const RATING_COLORS = {
  A: 'bg-green-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  F: 'bg-red-500'
};

/**
 * 业务价值评估组件Props接口
 */
export interface BusinessValueComponentProps {
  /** 是否禁用高级选项 */
  disableAdvancedOptions?: boolean;
  /** 初始ROI参数 */
  initialROIParams?: Partial<ROIParameters>;
  /** 初始决策支持参数 */
  initialDecisionParams?: Partial<DecisionSupportParameters>;
  /** 计算结果回调 */
  onCalculate?: (report: BusinessValueReport) => void;
}

/**
 * 业务价值评估组件
 * 提供投资回报率计算和决策支持效果评估的交互界面
 */
export const BusinessValueComponent: React.FC<BusinessValueComponentProps> = ({
  disableAdvancedOptions = false,
  initialROIParams = {},
  initialDecisionParams = {},
  onCalculate
}) => {
  // 初始化业务价值评估器
  const evaluator = new BusinessValueEvaluator();
  
  // 状态管理
  const [roiParams, setRoiParams] = useState<ROIParameters>({
    initialInvestment: initialROIParams.initialInvestment || 1000000,
    annualRevenue: initialROIParams.annualRevenue || 500000,
    operatingCosts: initialROIParams.operatingCosts || 200000,
    projectLifetime: initialROIParams.projectLifetime || 5,
    discountRate: initialROIParams.discountRate || 10,
    riskFactor: initialROIParams.riskFactor || 0.8,
    taxRate: initialROIParams.taxRate || 25,
    depreciationRate: initialROIParams.depreciationRate || 20
  });
  
  const [decisionParams, setDecisionParams] = useState<DecisionSupportParameters>({
    decisionAccuracyImprovement: initialDecisionParams.decisionAccuracyImprovement || 30,
    decisionTimeReduction: initialDecisionParams.decisionTimeReduction || 40,
    informationCoverageImprovement: initialDecisionParams.informationCoverageImprovement || 50,
    errorReduction: initialDecisionParams.errorReduction || 25,
    keyDecisionFrequency: initialDecisionParams.keyDecisionFrequency || 20,
    costPerError: initialDecisionParams.costPerError || 10000,
    averageDecisionHours: initialDecisionParams.averageDecisionHours || 8,
    hourlyLaborCost: initialDecisionParams.hourlyLaborCost || 150
  });
  
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionSupportResult | null>(null);
  const [report, setReport] = useState<BusinessValueReport | null>(null);
  const [activeTab, setActiveTab] = useState('roi');
  const [scenario, setScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(!disableAdvancedOptions);

  // 计算业务价值
  const calculateBusinessValue = useCallback(() => {
    try {
      // 计算ROI
      const roi = evaluator.calculateROI(roiParams);
      setRoiResult(roi);
      
      // 计算决策支持效果
      const decision = evaluator.evaluateDecisionSupport(decisionParams);
      setDecisionResult(decision);
      
      // 生成综合报告
      const businessReport = evaluator.generateBusinessValueReport(roi, decision);
      setReport(businessReport);
      
      // 调用回调
      if (onCalculate) {
        onCalculate(businessReport);
      }
    } catch (error) {
      console.error('计算业务价值时出错:', error);
    }
  }, [roiParams, decisionParams, evaluator, onCalculate]);

  // 处理ROI参数变化
  const handleRoiParamChange = (key: keyof ROIParameters, value: number) => {
    setRoiParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 处理决策支持参数变化
  const handleDecisionParamChange = (key: keyof DecisionSupportParameters, value: number) => {
    setDecisionParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 应用场景模拟
  const applyScenario = (scenarioType: 'base' | 'optimistic' | 'pessimistic') => {
    setScenario(scenarioType);
    
    // 应用场景参数
    const baseParams: ROIParameters = {
      initialInvestment: 1000000,
      annualRevenue: 500000,
      operatingCosts: 200000,
      projectLifetime: 5,
      discountRate: 10,
      riskFactor: 0.8,
      taxRate: 25,
      depreciationRate: 20
    };

    const scenarioRoiParams = { ...baseParams };

    switch (scenarioType) {
      case 'optimistic':
        scenarioRoiParams.annualRevenue *= 1.5;
        scenarioRoiParams.operatingCosts *= 0.9;
        scenarioRoiParams.projectLifetime = 7;
        break;
      case 'pessimistic':
        scenarioRoiParams.annualRevenue *= 0.7;
        scenarioRoiParams.operatingCosts *= 1.2;
        scenarioRoiParams.projectLifetime = 3;
        scenarioRoiParams.riskFactor = 0.5;
        break;
      default:
        // 保持base参数
        break;
    }

    setRoiParams(scenarioRoiParams);
  };

  // 重置参数
  const resetParams = () => {
    setRoiParams({
      initialInvestment: 1000000,
      annualRevenue: 500000,
      operatingCosts: 200000,
      projectLifetime: 5,
      discountRate: 10,
      riskFactor: 0.8,
      taxRate: 25,
      depreciationRate: 20
    });
    
    setDecisionParams({
      decisionAccuracyImprovement: 30,
      decisionTimeReduction: 40,
      informationCoverageImprovement: 50,
      errorReduction: 25,
      keyDecisionFrequency: 20,
      costPerError: 10000,
      averageDecisionHours: 8,
      hourlyLaborCost: 150
    });
    
    setScenario('base');
  };

  // 初始计算
  useEffect(() => {
    calculateBusinessValue();
  }, []); // 只在组件挂载时执行一次

  // 渲染ROI输入表单
  const renderROIForm = () => (
    <div className="space-y-6">
      {/* 基础参数 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基础投资参数</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="initial-investment">初始投资成本 (元)</Label>
            <span className="text-sm text-gray-500">{roiParams.initialInvestment.toLocaleString('zh-CN')}</span>
          </div>
          <div className="space-y-1">
            <Slider
              id="initial-investment"
              value={[roiParams.initialInvestment]}
              min={100000}
              max={50000000}
              step={100000}
              onValueChange={(value) => handleRoiParamChange('initialInvestment', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10万</span>
              <span>5000万</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="annual-revenue">年度收益 (元)</Label>
            <span className="text-sm text-gray-500">{roiParams.annualRevenue.toLocaleString('zh-CN')}</span>
          </div>
          <div className="space-y-1">
            <Slider
              id="annual-revenue"
              value={[roiParams.annualRevenue]}
              min={50000}
              max={10000000}
              step={50000}
              onValueChange={(value) => handleRoiParamChange('annualRevenue', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5万</span>
              <span>1000万</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="operating-costs">年度运营成本 (元)</Label>
            <span className="text-sm text-gray-500">{roiParams.operatingCosts.toLocaleString('zh-CN')}</span>
          </div>
          <div className="space-y-1">
            <Slider
              id="operating-costs"
              value={[roiParams.operatingCosts]}
              min={10000}
              max={5000000}
              step={10000}
              onValueChange={(value) => handleRoiParamChange('operatingCosts', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1万</span>
              <span>500万</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="project-lifetime">项目周期 (年)</Label>
          <Slider
            id="project-lifetime"
            value={[roiParams.projectLifetime]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => handleRoiParamChange('projectLifetime', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1年</span>
            <span>10年</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="discount-rate">贴现率 (%)</Label>
            <span className="text-sm text-gray-500">{roiParams.discountRate}%</span>
          </div>
          <Slider
            id="discount-rate"
            value={[roiParams.discountRate]}
            min={1}
            max={20}
            step={0.1}
            onValueChange={(value) => handleRoiParamChange('discountRate', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1%</span>
            <span>20%</span>
          </div>
        </div>
      </div>
      
      {/* 高级选项 */}
      {showAdvancedOptions && !disableAdvancedOptions && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">高级参数</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="risk-factor">风险系数</Label>
              <span className="text-sm text-gray-500">{roiParams.riskFactor}</span>
            </div>
            <Slider
              id="risk-factor"
              value={[roiParams.riskFactor || 0.5]}
              min={0.1}
              max={1}
              step={0.05}
              onValueChange={(value) => handleRoiParamChange('riskFactor', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>高风险 (0.1)</span>
              <span>低风险 (1.0)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="tax-rate">税收率 (%)</Label>
              <span className="text-sm text-gray-500">{roiParams.taxRate}%</span>
            </div>
            <Slider
              id="tax-rate"
              value={[roiParams.taxRate || 25]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => handleRoiParamChange('taxRate', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="depreciation-rate">加速折旧率 (%)</Label>
              <span className="text-sm text-gray-500">{roiParams.depreciationRate}%</span>
            </div>
            <Slider
              id="depreciation-rate"
              value={[roiParams.depreciationRate || 20]}
              min={5}
              max={50}
              step={1}
              onValueChange={(value) => handleRoiParamChange('depreciationRate', value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 场景预设 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">场景预设</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={scenario === 'base' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => applyScenario('base')}
          >
            基准场景
          </Button>
          <Button
            variant={scenario === 'optimistic' ? 'default' : 'secondary'}
            size="sm"
            className="bg-green-50 text-green-700 hover:bg-green-100"
            onClick={() => applyScenario('optimistic')}
          >
            乐观场景
          </Button>
          <Button
            variant={scenario === 'pessimistic' ? 'default' : 'secondary'}
            size="sm"
            className="bg-red-50 text-red-700 hover:bg-red-100"
            onClick={() => applyScenario('pessimistic')}
          >
            悲观场景
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resetParams}
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  );

  // 渲染决策支持表单
  const renderDecisionSupportForm = () => (
    <div className="space-y-6">
      {/* 决策效率参数 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">决策效率参数</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="decision-accuracy">决策准确率提升 (%)</Label>
            <span className="text-sm text-gray-500">{decisionParams.decisionAccuracyImprovement}%</span>
          </div>
          <Slider
            id="decision-accuracy"
            value={[decisionParams.decisionAccuracyImprovement]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('decisionAccuracyImprovement', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="decision-time">决策时间减少 (%)</Label>
            <span className="text-sm text-gray-500">{decisionParams.decisionTimeReduction}%</span>
          </div>
          <Slider
            id="decision-time"
            value={[decisionParams.decisionTimeReduction]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('decisionTimeReduction', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="info-coverage">信息覆盖率提升 (%)</Label>
            <span className="text-sm text-gray-500">{decisionParams.informationCoverageImprovement}%</span>
          </div>
          <Slider
            id="info-coverage"
            value={[decisionParams.informationCoverageImprovement]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('informationCoverageImprovement', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="error-reduction">错误决策减少 (%)</Label>
            <span className="text-sm text-gray-500">{decisionParams.errorReduction}%</span>
          </div>
          <Slider
            id="error-reduction"
            value={[decisionParams.errorReduction]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('errorReduction', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      {/* 成本参数 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">成本参数</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="decision-frequency">关键决策频率 (次/月)</Label>
            <span className="text-sm text-gray-500">{decisionParams.keyDecisionFrequency}</span>
          </div>
          <Slider
            id="decision-frequency"
            value={[decisionParams.keyDecisionFrequency]}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('keyDecisionFrequency', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1次/月</span>
            <span>100次/月</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="cost-per-error">每次错误决策成本 (元)</Label>
            <span className="text-sm text-gray-500">{decisionParams.costPerError.toLocaleString('zh-CN')}</span>
          </div>
          <Slider
            id="cost-per-error"
            value={[decisionParams.costPerError]}
            min={100}
            max={1000000}
            step={100}
            onValueChange={(value) => handleDecisionParamChange('costPerError', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>100元</span>
            <span>100万元</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="decision-hours">每次决策平均工时 (小时)</Label>
            <span className="text-sm text-gray-500">{decisionParams.averageDecisionHours}小时</span>
          </div>
          <Slider
            id="decision-hours"
            value={[decisionParams.averageDecisionHours]}
            min={1}
            max={40}
            step={1}
            onValueChange={(value) => handleDecisionParamChange('averageDecisionHours', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1小时</span>
            <span>40小时</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="labor-cost">每小时人工成本 (元)</Label>
            <span className="text-sm text-gray-500">{decisionParams.hourlyLaborCost}元</span>
          </div>
          <Slider
            id="labor-cost"
            value={[decisionParams.hourlyLaborCost]}
            min={50}
            max={1000}
            step={10}
            onValueChange={(value) => handleDecisionParamChange('hourlyLaborCost', value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>50元/小时</span>
            <span>1000元/小时</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染ROI结果
  const renderROIResults = () => {
    if (!roiResult) return null;

    // 准备图表数据
    const barChartData = [
      { name: 'ROI', value: roiResult.roi.toFixed(1) },
      { name: '年化ROI', value: roiResult.annualizedROI.toFixed(1) },
      { name: '风险调整ROI', value: roiResult.riskAdjustedROI.toFixed(1) }
    ];
    
    const lineChartData = roiResult.cashFlowProjection.map(item => ({
      year: `第${item.year}年`,
      cashFlow: item.cashFlow,
      discountedCashFlow: item.discountedCashFlow
    }));

    return (
      <div className="space-y-6">
        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">投资回报率 (ROI)</div>
            <div className="text-2xl font-bold mb-2">
              {roiResult.roi.toFixed(2)}%
              <Badge className={roiResult.roi >= 50 ? 'ml-2 bg-green-500' : 'ml-2 bg-red-500'}>
                {roiResult.roi >= 50 ? '优秀' : '需改进'}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">总投资: {roiParams.initialInvestment.toLocaleString('zh-CN')}元</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">净现值 (NPV)</div>
            <div className="text-2xl font-bold mb-2">
              {roiResult.npv.toLocaleString('zh-CN')}元
              <Badge className={roiResult.npv >= 0 ? 'ml-2 bg-green-500' : 'ml-2 bg-red-500'}>
                {roiResult.npv >= 0 ? '正值' : '负值'}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">贴现率: {roiParams.discountRate}%</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">回收期</div>
            <div className="text-2xl font-bold mb-2">
              {roiResult.paybackPeriod.toFixed(1)}年
              <Badge className={roiResult.paybackPeriod <= 2 ? 'ml-2 bg-green-500' : 'ml-2 bg-yellow-500'}>
                {roiResult.paybackPeriod <= 2 ? '快速回收' : '较慢回收'}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">项目周期: {roiParams.projectLifetime}年</div>
          </Card>
        </div>
        
        {/* 图表展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">回报率对比 (%)</h3>
            <BarChart
              series={[
                {
                  name: '回报率',
                  data: barChartData.map(item => ({
                    x: item.name,
                    y: parseFloat(item.value)
                  })),
                  color: '#4f46e5'
                }
              ]}
              height={300}
            />
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">现金流预测</h3>
            <LineChart
              series={[
                {
                  name: '现金流',
                  data: lineChartData.map(item => ({ x: item.year, y: item.cashFlow }))
                },
                {
                  name: '贴现后现金流',
                  data: lineChartData.map(item => ({ x: item.year, y: item.discountedCashFlow }))
                }
              ]}
              height={300}
            />
          </Card>
        </div>
        
        {/* 详细数据表格 */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">现金流详情</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年份</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">现金流 (元)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">贴现后现金流 (元)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累计贴现现金流 (元)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roiResult.cashFlowProjection.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.year === 0 ? '初始投资' : `第${item.year}年`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cashFlow.toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.discountedCashFlow.toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={item.cumulativeDiscountedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.cumulativeDiscountedCashFlow.toLocaleString('zh-CN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // 渲染决策支持结果
  const renderDecisionSupportResults = () => {
    if (!decisionResult) return null;

    // 准备饼图数据
    const pieChartData = [
      { name: '决策准确率', value: decisionResult.decisionQualityImprovement },
      { name: '剩余', value: 100 - decisionResult.decisionQualityImprovement }
    ];

    return (
      <div className="space-y-6">
        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">决策效率提升</div>
            <div className="text-2xl font-bold mb-2">
              {decisionResult.efficiencyScore.toFixed(1)}分
              <Badge className={decisionResult.efficiencyScore >= 70 ? 'ml-2 bg-green-500' : 'ml-2 bg-yellow-500'}>
                {decisionResult.efficiencyScore >= 70 ? '高效' : '一般'}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">满分100分</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">年度时间节省</div>
            <div className="text-2xl font-bold mb-2">
              {decisionResult.annualTimeSavings.toFixed(0)}小时
              <Badge className="ml-2 bg-blue-500">约{Math.round(decisionResult.annualTimeSavings / 2080 * 100) / 100}人年</Badge>
            </div>
            <div className="text-xs text-gray-400">按每年2080工作小时计算</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">年度成本节省</div>
            <div className="text-2xl font-bold mb-2">
              {decisionResult.annualCostSavings.toLocaleString('zh-CN')}元
              <Badge className="ml-2 bg-green-500">有效节约</Badge>
            </div>
            <div className="text-xs text-gray-400">包含时间成本和错误成本</div>
          </Card>
        </div>
        
        {/* 图表展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">决策质量提升</h3>
            <div className="flex justify-center">
              <PieChart
                series={[
                  {
                    name: '决策准确率分布',
                    data: pieChartData.map((item, index) => ({
                      x: item.name,
                      y: item.value,
                      color: index === 0 ? '#4f46e5' : '#e5e7eb'
                    }))
                  }
                ]}
                width={300}
                height={300}
              />
            </div>
            <div className="text-center text-sm mt-2">
              决策准确率提升至 {decisionResult.decisionQualityImprovement.toFixed(1)}%
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">年度价值构成</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>时间节省价值</span>
                  <span>{(decisionResult.annualCostSavings - decisionResult.annualErrorReductionValue).toLocaleString('zh-CN')}元</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${((decisionResult.annualCostSavings - decisionResult.annualErrorReductionValue) / decisionResult.annualCostSavings) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>错误减少价值</span>
                  <span>{decisionResult.annualErrorReductionValue.toLocaleString('zh-CN')}元</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${(decisionResult.annualErrorReductionValue / decisionResult.annualCostSavings) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>总计</span>
                  <span>{decisionResult.annualCostSavings.toLocaleString('zh-CN')}元</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 详细指标 */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">详细指标</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">决策准确率提升</span>
                <span className="text-sm font-medium">{decisionParams.decisionAccuracyImprovement}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">决策时间减少</span>
                <span className="text-sm font-medium">{decisionParams.decisionTimeReduction}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">信息覆盖率提升</span>
                <span className="text-sm font-medium">{decisionParams.informationCoverageImprovement}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">错误决策减少</span>
                <span className="text-sm font-medium">{decisionParams.errorReduction}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">投资回收期</span>
                <span className="text-sm font-medium">{decisionResult.investmentPaybackPeriod.toFixed(1)}个月</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">平均决策工时</span>
                <span className="text-sm font-medium">{decisionParams.averageDecisionHours}小时</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">年度决策次数</span>
                <span className="text-sm font-medium">{(decisionParams.keyDecisionFrequency * 12).toFixed(0)}次</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">综合价值评分</span>
                <span className="text-sm font-medium">{decisionResult.overallValueScore.toFixed(1)}/100</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // 渲染综合报告
  const renderExecutiveReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* 报告摘要卡片 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-indigo-900">业务价值评估报告</h2>
            <Badge className={`px-3 py-1 text-sm ${RATING_COLORS[report.investmentRating]}`}>
              投资评级: {report.investmentRating}
            </Badge>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-indigo-900 mb-4">{report.executiveSummary}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">整体价值评分</div>
              <div className="text-xl font-bold text-indigo-700">{report.overallValueScore.toFixed(1)}/100</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">财务评分</div>
              <div className="text-xl font-bold text-indigo-700">{report.financialScore.toFixed(1)}/100</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">效率评分</div>
              <div className="text-xl font-bold text-indigo-700">{report.efficiencyScore.toFixed(1)}/100</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">投资回报率 (ROI)</div>
              <div className="text-lg font-semibold text-indigo-700">{report.roiResult.roi.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">回收期</div>
              <div className="text-lg font-semibold text-indigo-700">{report.roiResult.paybackPeriod.toFixed(1)}年</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">年度成本节省</div>
              <div className="text-lg font-semibold text-indigo-700">{report.decisionSupportResult.annualCostSavings.toLocaleString('zh-CN')}元</div>
            </div>
          </div>
        </Card>
        
        {/* 建议部分 */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">行动建议</h3>
          {report.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <div className="mt-1 mr-2 text-indigo-500">•</div>
                  <div className="text-sm">{rec}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">暂无特定建议</div>
          )}
        </Card>
        
        {/* 详细分析 */}
        <Tabs defaultValue="financial">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="financial">财务分析</TabsTrigger>
            <TabsTrigger value="efficiency">效率分析</TabsTrigger>
          </TabsList>
          <TabsContent value="financial">
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">净现值 (NPV)</span>
                <span className="text-sm font-medium">{report.roiResult.npv.toLocaleString('zh-CN')}元</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">内部收益率 (IRR)</span>
                <span className="text-sm font-medium">{report.roiResult.irr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">总投资收益</span>
                <span className="text-sm font-medium">{report.roiResult.totalReturn.toLocaleString('zh-CN')}元</span>
              </div>
              <Separator />
              <div className="text-sm text-gray-500">
                风险调整后的投资回报率为 {report.roiResult.riskAdjustedROI.toFixed(2)}%，
                考虑到项目风险因素，此回报率
                {report.roiResult.riskAdjustedROI >= 30 ? ' 仍然具有吸引力' : ' 需谨慎评估'}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="efficiency">
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">年度时间节省</span>
                <span className="text-sm font-medium">{report.decisionSupportResult.annualTimeSavings.toFixed(0)}小时</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">决策质量提升</span>
                <span className="text-sm font-medium">{report.decisionSupportResult.decisionQualityImprovement.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">错误决策成本避免</span>
                <span className="text-sm font-medium">{report.decisionSupportResult.annualErrorReductionValue.toLocaleString('zh-CN')}元</span>
              </div>
              <Separator />
              <div className="text-sm text-gray-500">
                基于当前参数，预计将为组织带来显著的决策效率提升，
                每年可节约约 {report.decisionSupportResult.annualCostSavings.toLocaleString('zh-CN')}元
                的成本，投资回收期约为 {report.decisionSupportResult.investmentPaybackPeriod.toFixed(1)}个月
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">业务价值评估</h1>
          <p className="text-gray-500 text-sm">计算投资回报率和决策支持效果，评估业务价值</p>
        </div>
        <div className="flex gap-2">
          {!disableAdvancedOptions && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? '隐藏高级选项' : '显示高级选项'}
            </Button>
          )}
          <Button onClick={calculateBusinessValue}>
            重新计算
          </Button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧输入区域 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="p-4 space-y-6">
                <Tabs 
                  defaultValue="roi" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="roi">投资回报计算</TabsTrigger>
                    <TabsTrigger value="decision">决策支持评估</TabsTrigger>
                  </TabsList>
                  <TabsContent value="roi" className="space-y-4 m-0">
                    {renderROIForm()}
                  </TabsContent>
                  <TabsContent value="decision" className="space-y-4 m-0">
                    {renderDecisionSupportForm()}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </Card>
        </div>
        
        {/* 右侧结果区域 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="p-4 space-y-6">
                <Tabs defaultValue="report">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="report">综合报告</TabsTrigger>
                    <TabsTrigger value="roi-results">投资回报分析</TabsTrigger>
                    <TabsTrigger value="decision-results">决策支持分析</TabsTrigger>
                  </TabsList>
                  <TabsContent value="report" className="space-y-4 m-0">
                    {renderExecutiveReport()}
                  </TabsContent>
                  <TabsContent value="roi-results" className="space-y-4 m-0">
                    {renderROIResults()}
                  </TabsContent>
                  <TabsContent value="decision-results" className="space-y-4 m-0">
                    {renderDecisionSupportResults()}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessValueComponent;
