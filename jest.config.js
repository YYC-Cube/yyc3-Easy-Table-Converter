/**
 * @file Jest 配置文件（增强版）
 * @description 配置Jest测试框架，支持TypeScript、React组件测试和HTML覆盖率报告
 * @module jest.config
 * @author YYC
 * @version 2.0.0
 * @updated 2026-05-24 - 添加HTML覆盖率报告和性能监控
 */

const path = require('path');
const fs = require('fs');

const dotenvFiles = [
  '.env.test',
  '.env.development',
  '.env',
].filter(f => fs.existsSync(path.resolve(process.cwd(), f)));

dotenvFiles.forEach(file => {
  require('dotenv').config({ path: path.resolve(process.cwd(), file) });
});

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      useESM: false,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      }
    }],
  },
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/e2e/',
  ],
  
  roots: ['<rootDir>/__tests__'],
  
  testMatch: [
    '**/__tests__/utils/**/*.test.ts',
    '**/__tests__/services/**/*.test.ts',
    '**/__tests__/integration/**/*.test.ts',
    '**/__tests__/components/**/*.test.tsx',
    '**/__tests__/hooks/**/*.test.ts',
    '**/__tests__/mutation/**/*.test.ts',
  ],
  
  transformIgnorePatterns: [
    'node_modules/(?!(react|react-dom|@react|@testing|@vercel|next)/)',
  ],
  
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  verbose: true,
  testTimeout: 10000,
  
  // Coverage Configuration - Enhanced for HTML Reports
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary',
    'json'
  ],
  
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/__tests__/',
    '\\.d\\.ts$',
    '\\.config\\.(js|ts)$',
    '/coverage/',
  ],
  
  coverageProvider: 'v8',
  
  // Performance Monitoring
  reporters: [
    'default',
    // ['jest-junit', {
    //   outputDirectory: './test-results',
    //   outputName: 'junit.xml',
    //   includeErrorAttribute: true,
    //   includeConsoleOutput: true,
    //   ancestorSeparator: ' › ',
    //   suiteNameTemplate: '{filepath}',
    //   classNameTemplate: '{classname}',
    //   titleTemplate: '{title}'
    // }],
  ],
  
  // Test Results - Optional processor
  // testResultsProcessor: './scripts/test-results-processor.js',
};
