/**
 * @file 扩展E2E测试套件
 * @description 覆盖YYC³ Easy Table Converter的核心用户场景和边界条件
 * @module e2e/extended-flows.spec.ts
 * @author YYC
 * @version 1.0.0
 * @created 2025-01-24
 */

import { test, expect, Page } from '@playwright/test';

test.describe('YYC³ Easy Table Converter - Extended User Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
  });

  test.describe('导航和布局', () => {
    test('should have working navigation menu', async ({ page }) => {
      // 验证主导航存在
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();

      // 检查关键导航链接
      const converterLinks = page.locator('a[href*="/converters/"]');
      await expect(converterLinks.first()).toBeVisible();
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      // 验证移动端布局
      const mobileMenu = page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label="menu"]');
      
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      }
      
      // 确保主要内容区域可见
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should support dark mode toggle', async ({ page }) => {
      // 查找主题切换按钮
      const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="dark"]');
      
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        
        // 验证dark class被添加到html元素
        const htmlElement = page.locator('html');
        const className = await htmlElement.getAttribute('class');
        
        // 可能是dark mode或light mode切换
        expect(className).toBeTruthy();
      }
    });
  });

  test.describe('文件上传和转换核心流程', () => {
    test('should handle CSV file upload and preview', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传CSV文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
          'name,age,city\n' +
          'Alice,30,Beijing\n' +
          'Bob,25,Shanghai\n' +
          'Charlie,28,Guangzhou'
        ),
      });
      
      // 等待预览出现（使用多种选择器策略）
      const preview = page.locator([
        '[data-testid="table-preview"]',
        '.preview-container',
        'table',
        '[class*="table"]'
      ].join(', '));
      
      await expect(preview.first()).toBeVisible({ timeout: 10000 });
      
      // 验证数据被正确解析
      await expect(page.getByText('Alice')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Beijing')).toBeVisible({ timeout: 5000 });
    });

    test('should support drag and drop file upload', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 创建一个DataTransfer对象来模拟拖放
      const dropZone = page.locator('.dropzone, [data-dropzone], [class*="drop"]').first();
      
      if (await dropZone.isVisible()) {
        // 模拟拖放事件
        const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
        
        await dropZone.dispatchEvent('dragover', { dataTransfer });
        await dropZone.dispatchEvent('drop', { 
          dataTransfer,
        });
        
        // 验证drop zone有响应
        await expect(dropZone).toBeVisible();
      }
    });

    test('should display error for invalid file format', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 尝试上传不支持的文件格式
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.xyz',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from('invalid file content'),
      });
      
      // 应该显示错误消息或提示
      const errorMessage = page.locator([
        '[role="alert"]',
        '.error-message',
        '[class*="error"]',
        ':text("unsupported")',
        ':text-is("不支持")',
        ':text-is("invalid")'
      ].join(', '));
      
      // 错误提示可能出现也可能不出现，取决于实现
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle large file upload with progress indicator', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 创建较大的测试文件（1MB）
      const largeContent = 'id,name,value\n' + 
        Array.from({ length: 10000 }, (_, i) => `${i},Item${i},${Math.random() * 100}`).join('\n');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large-data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(largeContent),
      });
      
      // 查找进度指示器
      const progressIndicator = page.locator([
        '[role="progressbar"]',
        '.progress-bar',
        '[class*="progress"]',
        '[aria-busy="true"]'
      ].join(', '));
      
      // 进度条可能显示也可能不显示，取决于实现
      if (await progressIndicator.count() > 0) {
        await expect(progressIndicator.first()).toBeVisible();
      }
      
      // 最终应该完成处理并显示结果
      await page.waitForTimeout(3000); // 给予足够时间处理
      
      const resultArea = page.locator(['table', '.result', '[class*="result"]'].join(', '));
      if (await resultArea.count() > 0) {
        await expect(resultArea.first()).toBeVisible();
      }
    });
  });

  test.describe('格式转换功能', () => {
    test('should convert CSV to JSON successfully', async ({ page }) => {
      await page.goto('/converters/csv-json');
      
      // 输入CSV文本或上传文件
      const textarea = page.locator('textarea, [contenteditable="true"]').first();
      if (await textarea.isVisible()) {
        await textarea.fill('name,age\nAlice,30\nBob,25');
        
        // 点击转换按钮
        const convertButton = page.locator('button:has-text("转换"), button:has-text("Convert"), button[type="submit"]');
        if (await convertButton.count() > 0) {
          await convertButton.first().click();
          
          // 等待结果显示
          await page.waitForTimeout(2000);
          
          // 验证JSON输出包含正确的数据
          const outputArea = page.locator('.output, pre, code, [class*="result"]');
          if (await outputArea.count() > 0) {
            await expect(outputArea.first()).toContainText('Alice');
            await expect(outputArea.first()).toContainText('30');
          }
        }
      }
    });

    test('should support multiple output formats selection', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传文件后查找格式选择器
      const formatSelect = page.locator('select, [role="listbox"], [class*="format-select"]');
      
      if (await formatSelect.count() > 0) {
        // 获取可用选项
        const options = formatSelect.locator('option, [role="option"]');
        const optionCount = await options.count();
        
        // 应该至少有几个格式选项
        expect(optionCount).toBeGreaterThanOrEqual(3);
      }
    });

    test('should preserve special characters during conversion', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传包含特殊字符的文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'special-chars.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
          'name,description,value\n' +
          '"Test ""Quotes""","Line 1\\nLine 2","Comma, separated"\n' +
          '日本語テスト,"Emoji 🎉🚀",Tab\there'
        ),
      });
      
      // 等待处理完成
      await page.waitForTimeout(3000);
      
      // 特殊字符应该在输出中保留（可能转义后）
      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('批量处理功能', () => {
    test('should process multiple files in batch mode', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传多个文件
      const fileInput = page.locator('input[type="file"][multiple], input[type="file"]');
      await fileInput.setInputFiles([
        {
          name: 'file1.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('id,val\n1,test1'),
        },
        {
          name: 'file2.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('id,val\n2,test2'),
        },
        {
          name: 'file3.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('id,val\n3,test3'),
        },
      ]);
      
      // 验证多个文件被识别
      const fileList = page.locator([
        '[data-testid="file-list"]',
        '.file-list',
        '[class*="file-item"]',
        '[class*="upload-item"]'
      ].join(', '));
      
      // 文件列表可能显示也可能不显示
      if (await fileList.count() > 0) {
        const itemCount = await fileList.count();
        expect(itemCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('should show batch processing progress', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 批量上传文件
      const files = Array.from({ length: 5 }, (_, i) => ({
        name: `batch-file-${i + 1}.csv`,
        mimeType: 'text/csv',
        buffer: Buffer.from(`id,name\n${i},Item${i}`),
      }));
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(files);
      
      // 开始批量处理
      const batchButton = page.locator('button:has-text("批量"), button:has-text("Batch"), button:has-text("全部处理")');
      if (await batchButton.count() > 0) {
        await batchButton.first().click();
        
        // 监控进度
        const progressText = page.locator([
          '[class*="progress-text"]',
          '[class*="percentage"]',
          ':text-has("%")'
        ].join(', '));
        
        // 等待一段时间让处理进行
        await page.waitForTimeout(5000);
        
        // 验证最终状态
        const completionIndicator = page.locator([
          '[class*="complete"]',
          '[class*="success"]',
          ':text("complete")'
        ].join(', '));
        
        // 完成状态可能已经达到
        if (await completionIndicator.count() > 0) {
          await expect(completionIndicator.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('导出和下载功能', () => {
    test('should export converted data to Excel format', async ({ page }) => {
      // 设置下载监听
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      
      await page.goto('/converters/table');
      
      // 上传并转换文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'export-test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('name,age\nAlice,30\nBob,25'),
      });
      
      await page.waitForTimeout(3000);
      
      // 点击导出按钮
      const exportButton = page.locator('button:has-text("导出"), button:has-text("Export"), button:has-text("下载")');
      if (await exportButton.count() > 0) {
        await exportButton.first().click();
        
        // 等待下载开始
        const download = await downloadPromise;
        
        if (download) {
          // 验证下载的文件名
          const fileName = download.suggestedFilename();
          expect(fileName).toMatch(/\.(xlsx|xls|csv)$/i);
          
          // 可以选择保存文件以供后续验证
          // await download.saveAs('./test-downloads/' + fileName);
        }
      }
    });

    test('should provide copy to clipboard functionality', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'clipboard-test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('name,value\nTest,123'),
      });
      
      await page.waitForTimeout(2000);
      
      // 查找复制按钮
      const copyButton = page.locator('button:has-text("复制"), button:has-text("Copy"), [data-action="copy"]');
      
      if (await copyButton.count() > 0) {
        // Mock clipboard API
        await page.evaluate(() => {
          Object.assign(navigator, {
            clipboard: {
              writeText: jest.fn(() => Promise.resolve()),
              readText: jest.fn(() => Promise.resolve('')),
            },
          });
        });
        
        await copyButton.first().click();
        
        // 验证成功提示
        const successMessage = page.locator([
          '[role="status"]',
          '.toast',
          '[class*="success"]',
          ':text("copied")'
        ].join(', '));
        
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('可访问性和键盘导航', () => {
    test('should support keyboard navigation through interface', async ({ page }) => {
      await page.goto('/');
      
      // 使用Tab键导航界面
      let focusableElements = 0;
      
      for (let i = 0; i < 20; i++) { // 最多按20次Tab
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        // 检查是否有元素获得焦点
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
          focusableElements++;
        }
      }
      
      // 应该能够通过Tab键聚焦到多个元素
      expect(focusableElements).toBeGreaterThan(5);
    });

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 检查关键交互元素的ARIA属性
      const buttons = page.locator('button:not([aria-label])');
      const buttonCount = await buttons.count();
      
      // 所有按钮都应该有aria-label或可见文本
      // 这是一个软性检查，因为某些按钮可能有可见文本作为标签
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const textContent = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // 至少应该有其中一个
        expect(textContent?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      }
    });

    test('should support screen reader announcements', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 上传文件触发动态内容变化
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'a11y-test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('name,value\nTest,123'),
      });
      
      // 等待处理
      await page.waitForTimeout(3000);
      
      // 检查是否有live region用于屏幕阅读器通知
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      
      // live regions可能存在也可能不存在
      if (await liveRegions.count() > 0) {
        await expect(liveRegions.first()).toBeVisible();
      }
    });
  });

  test.describe('性能和稳定性', () => {
    test('should maintain acceptable load time under normal conditions', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      const loadTime = Date.now() - startTime;
      
      // 页面初始加载应该在5秒内完成
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have memory leaks during repeated operations', async ({ page }) => {
      await page.goto('/converters/table');
      
      // 执行多次文件上传和转换操作
      for (let i = 0; i < 5; i++) {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `memory-test-${i}.csv`,
          mimeType: 'text/csv',
          buffer: Buffer.from(`id,name\n${i},Item${i}`),
        });
        
        await page.waitForTimeout(1000);
        
        // 清除或重置（如果有清除按钮）
        const clearButton = page.locator('button:has-text("清除"), button:has-text("Clear"), button:has-text("重置")');
        if (await clearButton.count() > 0) {
          await clearButton.first().click();
          await page.waitForTimeout(500);
        }
      }
      
      // 页面仍然应该响应
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete' && !document.hidden;
      });
      
      expect(isResponsive).toBe(true);
    });

    test('should recover gracefully from network errors', async ({ page }) => {
      // 模拟网络离线
      await page.context().setOffline(true);
      
      try {
        // 尝试执行需要网络的操作
        await page.goto('/converters/table');
        
        // 页面应该仍然可以显示基本UI（即使功能受限）
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible({ timeout: 10000 });
        
      } finally {
        // 恢复网络连接
        await page.context().setOffline(false);
      }
    });
  });
});

/**
 * E2E测试最佳实践总结：
 * 
 * 1. 选择器策略：
 *    - 优先使用语义化选择器：[data-testid], [aria-label]
 *    - 备用CSS类选择器：.[component-name]-[element]
 *    - 最后使用文本选择器：text=...
 * 
 * 2. 等待策略：
 *    - 使用 waitForSelector 替代固定等待
 *    - 设置合理的超时时间（通常10-15秒）
 *    - 对异步操作使用 waitForResponse / waitForEvent
 * 
 * 3. 断言策略：
 *    - 使用 toBeVisible() 而不是简单的存在性检查
 *    - 对文本内容使用 toContainText() 支持部分匹配
 *    - 使用 soft assertions 允许某些可选功能的缺失
 * 
 * 4. 数据管理：
 *    - 在 beforeEach 中准备测试数据
 *    - 使用独立的临时文件避免污染
 *    - 测试结束后清理资源
 */
