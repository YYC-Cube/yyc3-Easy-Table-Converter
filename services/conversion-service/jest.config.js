/**
 * @file Jest配置文件
 * @description 配置Jest测试环境和运行选项
 * @module jest.config
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-16
 */

module.exports = {
  // 根目录
  rootDir: '.',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // 测试路径忽略模式
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // 模块名称映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 代码覆盖率设置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  
  // 转换设置
  transform: {
    '^.+\.tsx?$': 'ts-jest',
  },
  
  // 转换器配置
  transformIgnorePatterns: ['/node_modules/'],
  
  // 序列化器配置
  snapshotSerializers: [],
  
  // 超时设置
  testTimeout: 10000,
  
  // 运行测试时的随机顺序
  randomize: true,
  
  // 是否显示每个测试的详细信息
  verbose: true,
};