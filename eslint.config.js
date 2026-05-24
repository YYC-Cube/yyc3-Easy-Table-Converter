import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

// 忽略规则配置
const ignores = [
  // 配置文件
  '**/*.config.js',
  '**/*.config.ts',
  '**/*.config.*.js',
  '**/*.config.*.ts',
  '**/eslint.config.js',
  '**/next.config.js',
  // 公共目录
  'public/**',
  // 测试配置
  '**/*.test.js',
  '**/*.test.ts',
  '**/*.test.jsx',
  '**/*.test.tsx',
  '**/setupTests.js',
  '**/setupTests.ts',
  '**/jest.config.js',
  // Worker文件
  '**/*.worker.js',
  '**/*.worker.ts',
  // 构建输出目录
  '.next/**',
  'out/**',
  'build/**',
];

export default [
  {
    ignores,
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        webkitAudioContext: true,
        module: true,
        require: true,
        WebAssembly: true,
        u8: true,
        i32: true,
        path: true,
        // Web Worker 全局变量
        self: true,
        Worker: true,
        postMessage: true,
        onmessage: true,
        importScripts: true,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // 使用TypeScript ESLint和React的推荐配置
  ...tseslint.configs.recommendedTypeChecked, // 更完整的TypeScript检查
  pluginReact.configs.flat.recommended, // React推荐配置（已经是数组）
  // React Hooks规则配置
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // 项目自定义规则配置
  {
    rules: {
      // 禁用一些过于严格的规则
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn', // 改为警告，帮助发现未使用的变量
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // 改为警告，限制any的使用
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn', // 改为警告
      'react/prop-types': 'off', // TypeScript项目不需要prop-types
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'warn', // 确保JSX元素有key
      'react/jsx-no-target-blank': 'off',
    },
  },
];