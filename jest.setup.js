/**
 * @file Jest 环境设置文件
 * @description 配置Jest测试环境，加载必要的扩展
 * @module jest.setup
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('@testing-library/jest-dom');

console.log('[Jest Setup] DB_HOST:', process.env.DB_HOST);
console.log('[Jest Setup] DB_NAME:', process.env.DB_NAME);
console.log('[Jest Setup] NODE_ENV:', process.env.NODE_ENV);

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
