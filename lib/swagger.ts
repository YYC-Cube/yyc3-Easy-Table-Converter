/**
 * @file API 文档配置
 * @description Swagger/OpenAPI 文档配置
 * @module lib/swagger
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'YYC³ Easy Table Converter API',
    description: '企业级表格转换工具 API 文档',
    version: '1.0.0',
    contact: {
      name: 'YYC³ Team',
      email: 'support@yyc3.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3737',
      description: '本地开发服务器',
    },
    {
      url: 'https://staging.yyc3.com',
      description: '预发布环境',
    },
    {
      url: 'https://yyc3.com',
      description: '生产环境',
    },
  ],
  tags: [
    {
      name: '认证',
      description: '用户认证相关接口',
    },
    {
      name: '转换',
      description: '表格格式转换接口',
    },
    {
      name: '用户',
      description: '用户管理接口',
    },
    {
      name: '工具',
      description: '数据处理工具接口',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: '错误信息' },
          code: { type: 'string', example: 'ERROR_CODE' },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: '操作成功' },
          data: { type: 'object' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

export default swaggerConfig;
