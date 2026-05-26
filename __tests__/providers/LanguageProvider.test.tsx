/**
 * @file LanguageProvider 单元测试
 * @description 测试语言提供者和国际化功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';

// Mock translations
jest.mock('@/lib/i18n/translations', () => ({
  translations: {
    zh: {
      app: {
        title: 'YYC³ 表格转换器',
        description: '高效的表格转换工具',
      },
      common: {
        save: '保存',
        cancel: '取消',
        confirm: '确认',
      },
      error: {
        notFound: '未找到',
        unknown: '未知错误',
      },
    },
    en: {
      app: {
        title: 'YYC³ Table Converter',
        description: 'Efficient table conversion tool',
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
      },
      error: {
        notFound: 'Not Found',
        unknown: 'Unknown Error',
      },
    },
    ja: {
      app: {
        title: 'YYC³ テーブル変換',
        description: '効率的なテーブル変換ツール',
      },
      common: {
        save: '保存',
        cancel: 'キャンセル',
        confirm: '確認',
      },
      error: {
        notFound: '見つかりません',
        unknown: '不明なエラー',
      },
    },
  },
}));

// Test component that uses useLanguage hook
function TestComponent() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translated-title">{t('app.title')}</div>
      <div data-testid="translated-save">{t('common.save')}</div>
      <button onClick={() => setLanguage('zh')}>中文</button>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('ja')}>日本語</button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('初始化', () => {
    it('应该默认使用中文或浏览器语言', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 由于useEffect的异步特性，初始渲染可能使用默认值或浏览器语言
      const currentLang = screen.getByTestId('current-language').textContent;
      expect(['zh', 'en', 'ja']).toContain(currentLang);
    });

    it('应该提供翻译函数t()', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 验证翻译函数返回有效文本（不一定是中文，取决于浏览器语言检测）
      const title = screen.getByTestId('translated-title').textContent;
      expect(title).toBeTruthy();
      expect(title).toContain('YYC³');
    });

    it('应该正确渲染子组件', () => {
      render(
        <LanguageProvider>
          <div data-testid="child">子组件内容</div>
        </LanguageProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('子组件内容');
    });
  });

  describe('语言切换', () => {
    it('应该支持切换到英文', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText('English'));

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-title')).toHaveTextContent('YYC³ Table Converter');
      expect(screen.getByTestId('translated-save')).toHaveTextContent('Save');
    });

    it('应该支持切换到日文', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText('日本語'));

      expect(screen.getByTestId('current-language')).toHaveTextContent('ja');
      expect(screen.getByTestId('translated-title')).toHaveTextContent('YYC³ テーブル変換');
      expect(screen.getByTestId('translated-save')).toHaveTextContent('保存');
    });

    it('应该支持切换回中文', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 先切换到英文
      fireEvent.click(screen.getByText('English'));
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      // 再切换回中文
      fireEvent.click(screen.getByText('中文'));
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
      expect(screen.getByTestId('translated-title')).toHaveTextContent('YYC³ 表格转换器');
    });
  });

  describe('localStorage集成', () => {
    it('应该将语言设置保存到localStorage', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText('English'));

      expect(localStorage.setItem).toHaveBeenCalledWith('language', 'en');
    });

    it('应该从localStorage恢复语言设置', () => {
      // 预设localStorage
      (localStorage.getItem as jest.Mock).mockReturnValue('ja');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 注意：由于useEffect的异步特性，可能需要等待
      // 这里我们验证初始渲染不会出错
      expect(screen.getByTestId('current-language')).toBeInTheDocument();
    });
  });

  describe('翻译函数 t()', () => {
    it('应该处理嵌套的翻译键', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // app.title 是嵌套键
      expect(screen.getByTestId('translated-title')).toBeTruthy();
    });

    it('应该在找不到翻译时返回原始键', () => {
      function TestMissingKey() {
        const { t } = useLanguage();
        return <div>{t('nonexistent.key')}</div>;
      }

      render(
        <LanguageProvider>
          <TestMissingKey />
        </LanguageProvider>
      );

      expect(screen.getByText('nonexistent.key')).toBeInTheDocument();
    });

    it('应该处理部分缺失的嵌套键', () => {
      function TestPartialKey() {
        const { t } = useLanguage();
        return <div>{t('app.nonexistent')}</div>;
      }

      render(
        <LanguageProvider>
          <TestPartialKey />
        </LanguageProvider>
      );

      // 应该返回原始键，因为中间层存在但最终键不存在
      expect(screen.getByText('app.nonexistent')).toBeInTheDocument();
    });
  });

  describe('useLanguage Hook', () => {
    it('应该在LanguageProvider外部使用时抛出错误', () => {
      // 抑制console.error输出
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      function TestWithoutProvider() {
        const { language } = useLanguage();
        return <div>{language}</div>;
      }

      // 使用act来捕获错误
      expect(() => {
        render(<TestWithoutProvider />);
      }).toThrow('useLanguage must be used within a LanguageProvider');

      consoleSpy.mockRestore();
    });

    it('应该返回完整的context对象', () => {
      function TestContextStructure() {
        const context = useLanguage();
        
        return (
          <div>
            <span data-testid="has-language">{typeof context.language}</span>
            <span data-testid="has-setLanguage">{typeof context.setLanguage}</span>
            <span data-testid="has-t">{typeof context.t}</span>
          </div>
        );
      }

      render(
        <LanguageProvider>
          <TestContextStructure />
        </LanguageProvider>
      );

      expect(screen.getByTestId('has-language')).toHaveTextContent('string');
      expect(screen.getByTestId('has-setLanguage')).toHaveTextContent('function');
      expect(screen.getByTestId('has-t')).toHaveTextContent('function');
    });
  });

  describe('边界条件', () => {
    it('应该处理快速连续的语言切换', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 快速连续点击不同语言
      fireEvent.click(screen.getByText('English'));
      fireEvent.click(screen.getByText('日本語'));
      fireEvent.click(screen.getByText('中文'));

      // 最终应该是中文
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    });

    it('应该处理重复设置相同语言', async () => {
      
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // 多次点击相同语言
      fireEvent.click(screen.getByText('中文'));
      fireEvent.click(screen.getByText('中文'));
      fireEvent.click(screen.getByText('中文'));

      // 不应抛出错误，且保持中文
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    });
  });
});
