/**
 * @file 数据驱动示例页面
 * @description 演示数据驱动机制的使用方法和功能
 * @module industries/frontend-driver/example/ExamplePage
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Divider, 
  Paper, 
  Alert, 
  Grid,
  Container
} from '@mui/material';
import { DataDrivenProvider, useDataDriven, useFormSubmit } from '../hooks/useDataDriven';
import { DataDrivenInput } from '../components/DataDrivenInput';
import { DataDrivenSelect } from '../components/DataDrivenSelect';
import { DataDrivenCheckbox, DataDrivenCheckboxGroup } from '../components/DataDrivenCheckbox';
import { DataModel, ValidationRule } from '../types/DataDrivenTypes';

// 定义用户数据模型
const userModel: DataModel = {
  name: 'User',
  description: '用户信息数据模型',
  primaryKey: 'id',
  fields: [
    {
      name: 'id',
      type: 'string',
      label: '用户ID',
      required: false,
        meta: { disabled: true }
      },
    {
      name: 'username',
      type: 'string',
      label: '用户名',
      required: true,
      validations: [
        { type: 'required', message: '用户名不能为空' },
        { type: 'min', value: 3, message: '用户名长度不能少于3个字符' },
        { type: 'max', value: 20, message: '用户名长度不能超过20个字符' }
      ]
    },
    {
      name: 'email',
      type: 'string',
      label: '邮箱',
      required: true,
      validations: [
        { type: 'required', message: '邮箱不能为空' },
        { 
          type: 'pattern', 
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入有效的邮箱地址'
        }
      ]
    },
    {
      name: 'age',
      type: 'number',
      label: '年龄',
      required: true,
      defaultValue: 18,
      validations: [
        { type: 'required', message: '年龄不能为空' },
        { type: 'min', value: 18, message: '年龄不能小于18岁' },
        { type: 'max', value: 100, message: '年龄不能超过100岁' }
      ]
    },
    {
      name: 'gender',
      type: 'string',
      label: '性别',
      required: true,
      defaultValue: 'male',
      validations: [
        { type: 'required', message: '请选择性别' }
      ]
    },
    {
      name: 'role',
      type: 'string',
      label: '角色',
      required: true,
      defaultValue: 'user',
      validations: [
        { type: 'required', message: '请选择角色' }
      ]
    },
    {
      name: 'interests',
      type: 'array',
      label: '兴趣爱好',
      required: false,
      defaultValue: []
    },
    {
      name: 'active',
      type: 'boolean',
      label: '是否激活',
      required: false,
      defaultValue: true
    }
  ]
};

// 初始用户数据
const initialUserData = {
  id: 'user-' + Date.now(),
  username: '',
  email: '',
  age: 18,
  gender: 'male',
  role: 'user',
  interests: [],
  active: true
};

// 性别选项
const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
];

// 角色选项
const roleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'guest', label: '访客' }
];

// 兴趣爱好选项
const interestOptions = [
  { value: 'reading', label: '阅读' },
  { value: 'sports', label: '运动' },
  { value: 'music', label: '音乐' },
  { value: 'coding', label: '编程' },
  { value: 'travel', label: '旅行' }
];

// 自定义验证规则
const customValidations: ValidationRule[] = [
  {
    type: 'custom',
    message: '用户名不能包含特殊字符',
    validator: (value: string) => /^[a-zA-Z0-9_]+$/.test(value)
  }
];

// 用户表单组件
function UserForm() {
  const { data, resetData, validateData } = useDataDriven<typeof initialUserData>();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showData, setShowData] = useState(false);

  // 使用表单提交Hook
  const { handleSubmit, isSubmitting, submitError } = useFormSubmit<typeof initialUserData>(
    async (formData) => {
      // 模拟API提交
      console.log('提交的用户数据:', formData);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      setShowData(true);
      
      // 3秒后清除成功提示
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    }
  );

  // 处理手动验证
  const handleValidate = () => {
    const result = validateData();
    if (result.isValid) {
      setFormErrors([]);
    } else {
      setFormErrors(result.errors.map(err => `${err.field}: ${err.message}`));
    }
  };

  // 处理重置
  const handleReset = () => {
    resetData();
    setFormErrors([]);
    setSubmitSuccess(false);
    setShowData(false);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          用户信息表单
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          这是一个使用数据驱动机制实现的表单示例
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* 表单错误提示 */}
        {formErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">验证失败：</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            表单提交成功！
          </Alert>
        )}
        
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column', mb: 4 }}>
          {/* 用户名输入框 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              用户名
            </Typography>
            <DataDrivenInput
              fieldName="username"
              placeholder="请输入用户名"
            />
          </Box>
          
          {/* 邮箱输入框 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              邮箱
            </Typography>
            <DataDrivenInput
              fieldName="email"
              type="email"
              placeholder="请输入邮箱地址"
            />
          </Box>
          
          {/* 年龄输入框 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              年龄
            </Typography>
            <DataDrivenInput
              fieldName="age"
              type="number"
              placeholder="请输入年龄"
              parser={(value) => parseInt(value) || ''}
              formatter={(value) => value?.toString() || ''}
            />
          </Box>
          
          {/* 性别选择器 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              性别
            </Typography>
            <DataDrivenSelect
              fieldName="gender"
              options={genderOptions}
              placeholder="请选择性别"
            />
          </Box>
          
          {/* 角色选择器 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              角色
            </Typography>
            <DataDrivenSelect
              fieldName="role"
              options={roleOptions}
              placeholder="请选择角色"
            />
          </Box>
          
          {/* 兴趣爱好复选框组 */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              兴趣爱好
            </Typography>
            <DataDrivenCheckboxGroup
              fieldName="interests"
              options={interestOptions}
              direction="column"
              spacing={2}
            />
          </Box>
          
          {/* 激活状态复选框 */}
          <Box sx={{ mt: 2 }}>
            <DataDrivenCheckbox
              fieldName="active"
              label="激活账号"
              color="primary"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="large"
          >
            {isSubmitting ? '提交中...' : '提交表单'}
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleValidate}
          >
            验证数据
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleReset}
          >
            重置
          </Button>
          <Button 
            variant="text" 
            onClick={() => setShowData(!showData)}
          >
            {showData ? '隐藏数据' : '查看数据'}
          </Button>
        </Box>
        
        {/* 数据预览 */}
        {showData && (
          <Paper elevation={0} sx={{ mt: 4, p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              当前表单数据：
            </Typography>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-all', 
              fontFamily: 'monospace',
              padding: 10,
              backgroundColor: '#f5f5f5',
              borderRadius: 4
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
}

// 数据驱动配置信息卡片
function ConfigInfoCard() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom color="primary">
          数据驱动配置信息
        </Typography>
        
        <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              数据模型:
            </Typography>
            <Typography variant="body2">
              {userModel.name} - {userModel.description}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              字段数量:
            </Typography>
            <Typography variant="body2">
              {userModel.fields.length} 个字段
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              必填字段:
            </Typography>
            <Typography variant="body2">
              {userModel.fields.filter(f => f.required).map(f => f.name).join(', ')}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              验证规则:
            </Typography>
            <Typography variant="body2">
              支持 required, min, max, pattern, custom 等多种验证类型
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              数据绑定模式:
            </Typography>
            <Typography variant="body2">
              支持单向和双向数据绑定
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// 示例特性说明卡片
function FeaturesCard() {
  const features = [
    { title: '自动数据验证', desc: '基于模型配置自动进行数据验证' },
    { title: '双向数据绑定', desc: '表单控件与数据模型自动同步' },
    { title: '类型安全', desc: '完整的TypeScript类型支持' },
    { title: '错误处理', desc: '自动显示验证错误和提交错误' },
    { title: '自定义格式化', desc: '支持数据格式化和解析' },
    { title: '响应式更新', desc: '数据变化时UI自动更新' }
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom color="primary">
          数据驱动特性
        </Typography>
        
        <Grid container spacing={2}>
        {features.map((feature, index) => (
          <div style={{ width: '100%' }} key={index}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.desc}
                </Typography>
              </Paper>
              </div>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// 主示例页面
function ExamplePageContent() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          数据驱动机制示例
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 6 }}>
          演示前端驱动组件的数据绑定、验证和表单处理功能
        </Typography>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {/* 左侧表单 */}
          <div style={{ width: '100%', maxWidth: 'calc(100% - 320px)', marginRight: '32px' }}>
            <UserForm />
          </div>
          
          {/* 右侧配置信息 */}
          <div style={{ width: '320px', flexShrink: 0 }}>
            <Box sx={{ gap: 4, display: 'flex', flexDirection: 'column' }}>
              <ConfigInfoCard />
              <FeaturesCard />
            </Box>
            </div>
          </div>
      </Box>
    </Container>
  );
}

/**
 * 数据驱动示例页面组件
 * 使用数据驱动提供者包装整个页面
 */
export default function ExamplePage() {
  return (
    <DataDrivenProvider
      model={userModel}
      initialData={initialUserData}
      config={{
        autoValidate: true,
        enableTwoWayBinding: true,
        defaultValidations: customValidations
      }}
    >
      <ExamplePageContent />
    </DataDrivenProvider>
  );
}
