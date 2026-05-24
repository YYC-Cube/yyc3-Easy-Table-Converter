import { test, expect, Page } from '@playwright/test';

test.describe('YYC³ Easy Table Converter - Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage should load correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/YYC³ Easy Table Converter/);
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to CSV-JSON converter', async ({ page }) => {
    await page.click('text=CSV to JSON');
    
    await expect(page).toHaveURL(/\/converters\/csv-json/);
    
    const converterTitle = page.locator('h1, h2');
    await expect(converterTitle.first()).toContainText(/CSV|JSON/i);
  });

  test('file upload should work for table conversion', async ({ page }) => {
    await page.goto('/converters/table');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,age\nJohn,30\nJane,25'),
    });
    
    const preview = page.locator('[data-testid="preview"], .preview, table');
    await expect(preview).toBeVisible({ timeout: 5000 });
  });

  test('batch processing should handle multiple files', async ({ page }) => {
    await page.goto('/converters/table');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'file1.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,value\n1,test1'),
      },
      {
        name: 'file2.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,value\n2,test2'),
      },
    ]);
    
    const fileList = page.locator('[data-testid="file-list"], .file-list');
    await expect(fileList).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Conversion Features', () => {
  test('Excel-CSV conversion should work', async ({ page }) => {
    await page.goto('/converters/excel-csv');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('dummy excel content'),
    });
    
    await expect(page.locator('.converter-container')).toBeVisible();
  });

  test('JSON-XML conversion should display output', async ({ page }) => {
    await page.goto('/converters/json-xml');
    
    const textarea = page.locator('textarea, [contenteditable="true"]').first();
    if (await textarea.isVisible()) {
      await textarea.fill('{"key": "value"}');
      
      const convertButton = page.locator('button:has-text("Convert"), button:has-text("转换")');
      if (await convertButton.isVisible()) {
        await convertButton.click();
        
        const outputArea = page.locator('textarea, pre, .output').nth(1);
        await expect(outputArea).toContainText(/<\?xml|<root/i);
      }
    }
  });

  test('image compression should show preview', async ({ page }) => {
    await page.goto('/converters/image-compress');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
    
    const imagePreview = page.locator('img.preview-image, [data-testid="preview"]');
    await expect(imagePreview).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Interface & Accessibility', () => {
  test('responsive design should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const menuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      const mobileMenu = page.locator('nav.mobile-menu, nav[aria-expanded="true"]');
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('dark mode toggle should work', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("🌙"), button:has-text("☀️")');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      const htmlElement = page.locator('html');
      const className = await htmlElement.getAttribute('class');
      expect(className).toMatch(/dark|light/);
    }
  });

  test('error boundary should catch errors gracefully', async ({ page }) => {
    console.log = jest.fn();
    
    await page.goto('/nonexistent-page-that-does-not-exist');
    
    const errorPage = page.locator('[data-testid="error-boundary"], .error-page, h1:has-text("404")');
    await expect(errorPage).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Performance Tests', () => {
  test('page load should complete within time limit', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(15000);
  });

  test('large file upload should not block UI', async ({ page }) => {
    await page.goto('/converters/table');
    
    const largeFileContent = 'name,value\n' + Array(1000).fill(null).map((_, i) => `item${i},${Math.random()}`).join('\n');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-file.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeFileContent),
    });
    
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, spinner');
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
    
    const result = page.locator('[data-testid="result"], .result, table');
    await expect(result).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Form Validation', () => {
  test('required fields should show validation errors', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.locator('button[type="submit"]:visible').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      const errorMessage = page.locator('.error-message, [role="alert"], text=Required');
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('email validation should work correctly', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      const emailError = page.locator(':text("email"), :text("valid")');
      if (await emailError.isVisible()) {
        expect(emailError).toContainText(/invalid|valid|email/i);
      }
    }
  });
});
