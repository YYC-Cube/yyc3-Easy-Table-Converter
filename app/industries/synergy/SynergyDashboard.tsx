/**
 * @file 跨行业协同仪表盘组件
 * @description 提供行业协同数据互通和工作流管理的可视化界面
 * @module industries/synergy
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import React, { useState, useEffect } from 'react';
import { IndustrySynergy, Industry, ProcessStatus, CrossIndustryExchangeRequest } from './IndustrySynergy';
import { DataFormat } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button, Card, CardContent, CardHeader, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Snackbar } from '@mui/material';

/**
 * 协同仪表盘组件属性接口
 */
interface SynergyDashboardProps {
  /**
   * 行业协同实例
   */
  synergyInstance: IndustrySynergy;
}

/**
 * 行业协同仪表盘组件
 */
const SynergyDashboard: React.FC<SynergyDashboardProps> = ({ synergyInstance }) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<number>(0);
  const [sourceIndustry, setSourceIndustry] = useState<Industry>(Industry.FINANCE);
  const [targetIndustry, setTargetIndustry] = useState<Industry>(Industry.MANUFACTURING);
  const [dataFormat, setDataFormat] = useState<DataFormat>(DataFormat.JSON);
  const [exchangeData, setExchangeData] = useState<string>('{"sample": "data"}');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exchangeResult, setExchangeResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [exchangeHistory, setExchangeHistory] = useState<ExchangeHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalExchanges: 0,
    successfulExchanges: 0,
    failedExchanges: 0,
    avgProcessingTime: 0,
  });
  const [industryDistribution, setIndustryDistribution] = useState<IndustryDistribution[]>([]);
  const [recentExchanges, setRecentExchanges] = useState<ExchangeHistoryItem[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [workflowData, setWorkflowData] = useState<string>('{"sourceIndustry": "finance", "targetIndustry": "manufacturing"}');
  const [workflowResult, setWorkflowResult] = useState<any>(null);
  const [isWorkflowProcessing, setIsWorkflowProcessing] = useState<boolean>(false);

  // 行业选项
  const industryOptions = Object.values(Industry).map((industry) => ({
    value: industry,
    label: getIndustryLabel(industry),
  }));

  // 数据格式选项
  const formatOptions = Object.values(DataFormat).map((format) => ({
    value: format,
    label: getFormatLabel(format),
  }));

  // 初始化数据
  useEffect(() => {
    // 加载历史数据和统计信息
    loadInitialData();
  }, []);

  /**
   * 加载初始数据
   */
  const loadInitialData = () => {
    // 模拟历史数据
    const mockHistory: ExchangeHistoryItem[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: Industry.FINANCE,
        target: Industry.MANUFACTURING,
        status: 'success',
        processingTime: 120,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: Industry.HEALTHCARE,
        target: Industry.FINANCE,
        status: 'success',
        processingTime: 150,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        source: Industry.RETAIL,
        target: Industry.TECHNOLOGY,
        status: 'failed',
        processingTime: 90,
      },
    ];
    
    setExchangeHistory(mockHistory);
    updateStatistics(mockHistory);
    updateIndustryDistribution(mockHistory);
    setRecentExchanges(mockHistory.slice(0, 5));
    
    // 模拟工作流数据
    setWorkflows([
      { id: 'wf1', name: '财务到制造数据同步', source: Industry.FINANCE, target: Industry.MANUFACTURING },
      { id: 'wf2', name: '医疗数据合规处理', source: Industry.HEALTHCARE, target: Industry.GOVERNMENT },
      { id: 'wf3', name: '零售销售分析', source: Industry.RETAIL, target: Industry.TECHNOLOGY },
    ]);
  };

  /**
   * 更新统计信息
   * @param history 历史数据
   */
  const updateStatistics = (history: ExchangeHistoryItem[]) => {
    const total = history.length;
    const successful = history.filter(item => item.status === 'success').length;
    const failed = history.filter(item => item.status === 'failed').length;
    const avgTime = history.length > 0 
      ? history.reduce((sum, item) => sum + item.processingTime, 0) / history.length 
      : 0;
    
    setStatistics({
      totalExchanges: total,
      successfulExchanges: successful,
      failedExchanges: failed,
      avgProcessingTime: avgTime,
    });
  };

  /**
   * 更新行业分布数据
   * @param history 历史数据
   */
  const updateIndustryDistribution = (history: ExchangeHistoryItem[]) => {
    const distribution = new Map<Industry, number>();
    
    history.forEach(item => {
      const source = item.source;
      distribution.set(source, (distribution.get(source) || 0) + 1);
    });
    
    const distributionArray: IndustryDistribution[] = Array.from(distribution.entries()).map(([industry, count]) => ({
      industry,
      count,
    }));
    
    setIndustryDistribution(distributionArray);
  };

  /**
   * 标签切换处理函数
   * @param event 事件对象
   * @param newValue 新标签索引
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * 处理数据交换
   */
  const handleExchangeData = async () => {
    setIsProcessing(true);
    setError('');
    setExchangeResult(null);
    
    try {
      // 解析数据
      let parsedData;
      try {
        parsedData = JSON.parse(exchangeData);
      } catch (parseError) {
        throw new Error('数据格式不正确，请确保是有效的JSON格式');
      }
      
      // 创建交换请求
      const request: CrossIndustryExchangeRequest = {
        requestId: `req_${Date.now()}`,
        sourceIndustry,
        targetIndustry,
        format: dataFormat,
        data: parsedData,
        metadata: {
          initiatedBy: 'user',
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };
      
      // 执行数据交换
      const result = await synergyInstance.exchangeData(request);
      
      // 更新状态
      setExchangeResult(result);
      
      // 记录历史
      const historyItem: ExchangeHistoryItem = {
        id: request.requestId,
        timestamp: new Date().toISOString(),
        source: sourceIndustry,
        target: targetIndustry,
        status: result.success ? 'success' : 'failed',
        processingTime: result.processingTime,
        result: result,
      };
      
      const updatedHistory = [historyItem, ...exchangeHistory];
      setExchangeHistory(updatedHistory);
      updateStatistics(updatedHistory);
      updateIndustryDistribution(updatedHistory);
      setRecentExchanges(updatedHistory.slice(0, 5));
      
      if (result.success) {
        setSuccessMessage('数据交换成功');
      } else {
        throw new Error(result.error?.message || '数据交换失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 处理工作流执行
   */
  const handleExecuteWorkflow = async () => {
    setIsWorkflowProcessing(true);
    setError('');
    setWorkflowResult(null);
    
    try {
      // 解析工作流数据
      let parsedData;
      try {
        parsedData = JSON.parse(workflowData);
      } catch (parseError) {
        throw new Error('工作流数据格式不正确，请确保是有效的JSON格式');
      }
      
      // 执行工作流
      const result = await synergyInstance.startWorkflow(selectedWorkflow, parsedData);
      
      // 更新状态
      setWorkflowResult(result);
      setSuccessMessage('工作流执行成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理过程中发生错误');
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  /**
   * 处理历史记录项点击
   * @param item 历史记录项
   */
  const handleHistoryItemClick = (item: ExchangeHistoryItem) => {
    setExchangeResult(item.result);
    setActiveTab(0);
  };

  /**
   * 关闭消息提示
   */
  const handleCloseMessage = () => {
    setError('');
    setSuccessMessage('');
  };

  /**
   * 获取行业标签
   * @param industry 行业
   * @returns 标签文本
   */
  function getIndustryLabel(industry: Industry): string {
    const labels: Record<Industry, string> = {
      [Industry.FINANCE]: '金融',
      [Industry.HEALTHCARE]: '医疗',
      [Industry.MANUFACTURING]: '制造业',
      [Industry.RETAIL]: '零售业',
      [Industry.EDUCATION]: '教育',
      [Industry.GOVERNMENT]: '政府',
      [Industry.LOGISTICS]: '物流',
      [Industry.TECHNOLOGY]: '科技',
    };
    return labels[industry] || industry;
  }

  /**
   * 获取格式标签
   * @param format 数据格式
   * @returns 标签文本
   */
  function getFormatLabel(format: DataFormat): string {
    const labels: Record<DataFormat, string> = {
      [DataFormat.JSON]: 'JSON',
      [DataFormat.CSV]: 'CSV',
      [DataFormat.XML]: 'XML',
      [DataFormat.EXCEL]: 'Excel',
      [DataFormat.API]: 'API',
      [DataFormat.DATABASE]: '数据库',
    };
    return labels[format] || format;
  }

  /**
   * 获取状态标签
   * @param status 状态
   * @returns 标签文本
   */
  function getStatusLabel(status: ProcessStatus | string): string {
    const labels: Record<ProcessStatus | string, string> = {
      [ProcessStatus.PENDING]: '等待中',
      [ProcessStatus.IN_PROGRESS]: '处理中',
      [ProcessStatus.COMPLETED]: '已完成',
      [ProcessStatus.FAILED]: '失败',
      [ProcessStatus.CANCELLED]: '已取消',
      'success': '成功',
    };
    return labels[status] || status;
  }

  /**
   * 获取状态样式
   * @param status 状态
   * @returns 样式类名
   */
  function getStatusStyle(status: ProcessStatus | string): string {
    const styles: Record<ProcessStatus | string, string> = {
      [ProcessStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ProcessStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [ProcessStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ProcessStatus.FAILED]: 'bg-red-100 text-red-800',
      [ProcessStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  // 图表数据
  const barChartData = [
    { name: '总交换次数', value: statistics.totalExchanges },
    { name: '成功交换', value: statistics.successfulExchanges },
    { name: '失败交换', value: statistics.failedExchanges },
  ];

  const pieChartData = industryDistribution.map(item => ({
    name: getIndustryLabel(item.industry),
    value: item.count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Typography variant="h4" component="h1" className="text-2xl font-bold mb-4">
          跨行业协同仪表盘
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          提供不同行业间的数据互通机制和协同处理功能
        </Typography>
      </div>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="协同功能标签页">
          <Tab label="数据交换" />
          <Tab label="工作流管理" />
          <Tab label="统计分析" />
          <Tab label="交换历史" />
        </Tabs>
      </Box>

      {/* 数据交换标签 */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="数据交换配置" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormControl fullWidth>
                  <InputLabel>源行业</InputLabel>
                  <Select
                    value={sourceIndustry}
                    label="源行业"
                    onChange={(e) => setSourceIndustry(e.target.value)}
                  >
                    {industryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>目标行业</InputLabel>
                  <Select
                    value={targetIndustry}
                    label="目标行业"
                    onChange={(e) => setTargetIndustry(e.target.value)}
                  >
                    {industryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>数据格式</InputLabel>
                  <Select
                    value={dataFormat}
                    label="数据格式"
                    onChange={(e) => setDataFormat(e.target.value)}
                  >
                    {formatOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              
              <div className="mt-6">
                <TextField
                  fullWidth
                  label="交换数据"
                  multiline
                  rows={8}
                  variant="outlined"
                  value={exchangeData}
                  onChange={(e) => setExchangeData(e.target.value)}
                  placeholder="请输入要交换的数据，JSON格式"
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleExchangeData}
                  disabled={isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={16} /> : undefined}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? '处理中...' : '执行数据交换'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 交换结果 */}
          {exchangeResult && (
            <Card className="mt-6">
              <CardHeader title="交换结果" />
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Typography variant="body2" component="pre" className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(exchangeResult, null, 2)}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 工作流管理标签 */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="工作流执行" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormControl fullWidth>
                  <InputLabel>选择工作流</InputLabel>
                  <Select
                    value={selectedWorkflow}
                    label="选择工作流"
                    onChange={(e) => setSelectedWorkflow(e.target.value)}
                  >
                    {workflows.map((workflow) => (
                      <MenuItem key={workflow.id} value={workflow.id}>
                        {workflow.name} ({getIndustryLabel(workflow.source)} → {getIndustryLabel(workflow.target)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              
              <div className="mt-6">
                <TextField
                  fullWidth
                  label="工作流数据"
                  multiline
                  rows={6}
                  variant="outlined"
                  value={workflowData}
                  onChange={(e) => setWorkflowData(e.target.value)}
                  placeholder="请输入工作流数据，JSON格式"
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleExecuteWorkflow}
                  disabled={isWorkflowProcessing || !selectedWorkflow}
                  startIcon={isWorkflowProcessing ? <CircularProgress size={16} /> : undefined}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isWorkflowProcessing ? '执行中...' : '执行工作流'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 工作流结果 */}
          {workflowResult && (
            <Card className="mt-6">
              <CardHeader title="工作流执行结果" />
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Typography variant="body2" component="pre" className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(workflowResult, null, 2)}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 工作流列表 */}
          <Card>
            <CardHeader title="工作流列表" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell>工作流名称</TableCell>
                      <TableCell>源行业</TableCell>
                      <TableCell>目标行业</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>{workflow.name}</TableCell>
                        <TableCell>{getIndustryLabel(workflow.source)}</TableCell>
                        <TableCell>{getIndustryLabel(workflow.target)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            color="primary" 
                            onClick={() => setSelectedWorkflow(workflow.id)}
                          >
                            选择
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 统计分析标签 */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 统计卡片 */}
          <Card>
            <CardHeader title="交换统计" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <Typography variant="body1" className="font-medium">总交换次数：</Typography>
                  <Typography variant="body1">{statistics.totalExchanges}</Typography>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <Typography variant="body1" className="font-medium">成功交换：</Typography>
                  <Typography variant="body1" className="text-green-600">{statistics.successfulExchanges}</Typography>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <Typography variant="body1" className="font-medium">失败交换：</Typography>
                  <Typography variant="body1" className="text-red-600">{statistics.failedExchanges}</Typography>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <Typography variant="body1" className="font-medium">成功率：</Typography>
                  <Typography variant="body1">
                    {statistics.totalExchanges > 0 
                      ? `${Math.round((statistics.successfulExchanges / statistics.totalExchanges) * 100)}%` 
                      : '0%'
                    }
                  </Typography>
                </div>
                <div className="flex justify-between items-center py-2">
                  <Typography variant="body1" className="font-medium">平均处理时间：</Typography>
                  <Typography variant="body1">{statistics.avgProcessingTime}ms</Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 行业分布饼图 */}
          <Card>
            <CardHeader title="行业分布" />
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 交换统计柱状图 */}
          <Card className="md:col-span-2">
            <CardHeader title="交换统计图表" />
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 最近交换 */}
          <Card className="md:col-span-2">
            <CardHeader title="最近交换记录" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell>时间</TableCell>
                      <TableCell>源行业</TableCell>
                      <TableCell>目标行业</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>处理时间</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentExchanges.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{getIndustryLabel(item.source)}</TableCell>
                        <TableCell>{getIndustryLabel(item.target)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </TableCell>
                        <TableCell>{item.processingTime}ms</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => handleHistoryItemClick(item)}>
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 交换历史标签 */}
      {activeTab === 3 && (
        <Card>
          <CardHeader title="交换历史" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell>ID</TableCell>
                    <TableCell>时间</TableCell>
                    <TableCell>源行业</TableCell>
                    <TableCell>目标行业</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>处理时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exchangeHistory.map((item) => (
                    <TableRow key={item.id} hover onClick={() => handleHistoryItemClick(item)} className="cursor-pointer">
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{getIndustryLabel(item.source)}</TableCell>
                      <TableCell>{getIndustryLabel(item.target)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell>{item.processingTime}ms</TableCell>
                      <TableCell>
                        <Button size="small">查看详情</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {exchangeHistory.length === 0 && (
              <div className="text-center py-8">
                <Typography variant="body1" className="text-gray-500">
                  暂无交换历史记录
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={handleCloseMessage} sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* 成功提示 */}
      {successMessage && (
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={handleCloseMessage} sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

/**
 * 交换历史项接口
 */
interface ExchangeHistoryItem {
  id: string;
  timestamp: string;
  source: Industry;
  target: Industry;
  status: string;
  processingTime: number;
  result?: any;
}

/**
 * 统计数据接口
 */
interface StatisticsData {
  totalExchanges: number;
  successfulExchanges: number;
  failedExchanges: number;
  avgProcessingTime: number;
}

/**
 * 行业分布数据接口
 */
interface IndustryDistribution {
  industry: Industry;
  count: number;
}

export default SynergyDashboard;
