# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flows.spec.ts >> Conversion Features >> image compression should show preview
- Location: e2e/core-flows.spec.ts:94:7

# Error details

```
TimeoutError: locator.setInputFiles: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type="file"]')

```

# Page snapshot

```yaml
- main [ref=e7]:
  - generic [ref=e10]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - img "Grafana" [ref=e14]
        - heading "Welcome to Grafana" [level=1] [ref=e16]
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e24]: Email or username
          - textbox "Email or username" [active] [ref=e29]:
            - /placeholder: email or username
        - generic [ref=e30]:
          - generic [ref=e33]: Password
          - generic [ref=e37]:
            - textbox "Password" [ref=e38]:
              - /placeholder: password
            - switch "Show password" [ref=e40] [cursor=pointer]:
              - img [ref=e41]
        - button "Log in" [ref=e43] [cursor=pointer]:
          - generic [ref=e44]: Log in
        - link "Forgot your password?" [ref=e46] [cursor=pointer]:
          - /url: /user/password/send-reset-email
          - generic [ref=e47]: Forgot your password?
    - list [ref=e50]:
      - listitem [ref=e51]:
        - img [ref=e52]
        - link "Documentation" [ref=e54] [cursor=pointer]:
          - /url: https://grafana.com/docs/grafana/latest/?utm_source=grafana_footer
        - text: "|"
      - listitem [ref=e55]:
        - img [ref=e56]
        - link "Support" [ref=e58] [cursor=pointer]:
          - /url: https://grafana.com/products/enterprise/?utm_source=grafana_footer
        - text: "|"
      - listitem [ref=e59]:
        - img [ref=e60]
        - link "Community" [ref=e62] [cursor=pointer]:
          - /url: https://community.grafana.com/?utm_source=grafana_footer
        - text: "|"
      - listitem [ref=e63]:
        - link "Open Source" [ref=e64] [cursor=pointer]:
          - /url: https://grafana.com/oss/grafana?utm_source=grafana_footer
        - text: "|"
      - listitem [ref=e65]:
        - link "Grafana v12.4.1 (46a02dc12a)" [ref=e66] [cursor=pointer]:
          - /url: https://github.com/grafana/grafana/blob/main/CHANGELOG.md
        - text: "|"
      - listitem [ref=e67]:
        - img [ref=e68]
        - link "New version available!" [ref=e70] [cursor=pointer]:
          - /url: https://grafana.com/grafana/download?utm_source=grafana_footer
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | test.describe('YYC³ Easy Table Converter - Core User Flows', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('homepage should load correctly', async ({ page }) => {
  9   |     await expect(page).toHaveTitle(/YYC³ Easy Table Converter/);
  10  |     
  11  |     const header = page.locator('header');
  12  |     await expect(header).toBeVisible();
  13  |     
  14  |     const mainContent = page.locator('main');
  15  |     await expect(mainContent).toBeVisible();
  16  |   });
  17  | 
  18  |   test('should navigate to CSV-JSON converter', async ({ page }) => {
  19  |     await page.click('text=CSV to JSON');
  20  |     
  21  |     await expect(page).toHaveURL(/\/converters\/csv-json/);
  22  |     
  23  |     const converterTitle = page.locator('h1, h2');
  24  |     await expect(converterTitle.first()).toContainText(/CSV|JSON/i);
  25  |   });
  26  | 
  27  |   test('file upload should work for table conversion', async ({ page }) => {
  28  |     await page.goto('/converters/table');
  29  |     
  30  |     const fileInput = page.locator('input[type="file"]');
  31  |     await fileInput.setInputFiles({
  32  |       name: 'test.csv',
  33  |       mimeType: 'text/csv',
  34  |       buffer: Buffer.from('name,age\nJohn,30\nJane,25'),
  35  |     });
  36  |     
  37  |     const preview = page.locator('[data-testid="preview"], .preview, table');
  38  |     await expect(preview).toBeVisible({ timeout: 5000 });
  39  |   });
  40  | 
  41  |   test('batch processing should handle multiple files', async ({ page }) => {
  42  |     await page.goto('/converters/table');
  43  |     
  44  |     const fileInput = page.locator('input[type="file"]');
  45  |     await fileInput.setInputFiles([
  46  |       {
  47  |         name: 'file1.csv',
  48  |         mimeType: 'text/csv',
  49  |         buffer: Buffer.from('id,value\n1,test1'),
  50  |       },
  51  |       {
  52  |         name: 'file2.csv',
  53  |         mimeType: 'text/csv',
  54  |         buffer: Buffer.from('id,value\n2,test2'),
  55  |       },
  56  |     ]);
  57  |     
  58  |     const fileList = page.locator('[data-testid="file-list"], .file-list');
  59  |     await expect(fileList).toBeVisible({ timeout: 5000 });
  60  |   });
  61  | });
  62  | 
  63  | test.describe('Conversion Features', () => {
  64  |   test('Excel-CSV conversion should work', async ({ page }) => {
  65  |     await page.goto('/converters/excel-csv');
  66  |     
  67  |     const fileInput = page.locator('input[type="file"]');
  68  |     await fileInput.setInputFiles({
  69  |       name: 'test.xlsx',
  70  |       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  71  |       buffer: Buffer.from('dummy excel content'),
  72  |     });
  73  |     
  74  |     await expect(page.locator('.converter-container')).toBeVisible();
  75  |   });
  76  | 
  77  |   test('JSON-XML conversion should display output', async ({ page }) => {
  78  |     await page.goto('/converters/json-xml');
  79  |     
  80  |     const textarea = page.locator('textarea, [contenteditable="true"]').first();
  81  |     if (await textarea.isVisible()) {
  82  |       await textarea.fill('{"key": "value"}');
  83  |       
  84  |       const convertButton = page.locator('button:has-text("Convert"), button:has-text("转换")');
  85  |       if (await convertButton.isVisible()) {
  86  |         await convertButton.click();
  87  |         
  88  |         const outputArea = page.locator('textarea, pre, .output').nth(1);
  89  |         await expect(outputArea).toContainText(/<\?xml|<root/i);
  90  |       }
  91  |     }
  92  |   });
  93  | 
  94  |   test('image compression should show preview', async ({ page }) => {
  95  |     await page.goto('/converters/image-compress');
  96  |     
  97  |     const fileInput = page.locator('input[type="file"]');
> 98  |     await fileInput.setInputFiles({
      |     ^ TimeoutError: locator.setInputFiles: Timeout 10000ms exceeded.
  99  |       name: 'test.png',
  100 |       mimeType: 'image/png',
  101 |       buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
  102 |     });
  103 |     
  104 |     const imagePreview = page.locator('img.preview-image, [data-testid="preview"]');
  105 |     await expect(imagePreview).toBeVisible({ timeout: 10000 });
  106 |   });
  107 | });
  108 | 
  109 | test.describe('User Interface & Accessibility', () => {
  110 |   test('responsive design should work on mobile', async ({ page }) => {
  111 |     await page.setViewportSize({ width: 375, height: 667 });
  112 |     await page.goto('/');
  113 |     
  114 |     const header = page.locator('header');
  115 |     await expect(header).toBeVisible();
  116 |     
  117 |     const menuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger');
  118 |     if (await menuToggle.isVisible()) {
  119 |       await menuToggle.click();
  120 |       const mobileMenu = page.locator('nav.mobile-menu, nav[aria-expanded="true"]');
  121 |       await expect(mobileMenu).toBeVisible();
  122 |     }
  123 |   });
  124 | 
  125 |   test('dark mode toggle should work', async ({ page }) => {
  126 |     await page.goto('/');
  127 |     
  128 |     const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("🌙"), button:has-text("☀️")');
  129 |     if (await themeToggle.isVisible()) {
  130 |       await themeToggle.click();
  131 |       
  132 |       const htmlElement = page.locator('html');
  133 |       const className = await htmlElement.getAttribute('class');
  134 |       expect(className).toMatch(/dark|light/);
  135 |     }
  136 |   });
  137 | 
  138 |   test('error boundary should catch errors gracefully', async ({ page }) => {
  139 |     console.log = jest.fn();
  140 |     
  141 |     await page.goto('/nonexistent-page-that-does-not-exist');
  142 |     
  143 |     const errorPage = page.locator('[data-testid="error-boundary"], .error-page, h1:has-text("404")');
  144 |     await expect(errorPage).toBeVisible({ timeout: 10000 });
  145 |   });
  146 | });
  147 | 
  148 | test.describe('Performance Tests', () => {
  149 |   test('page load should complete within time limit', async ({ page }) => {
  150 |     const startTime = Date.now();
  151 |     
  152 |     await page.goto('/', { waitUntil: 'networkidle' });
  153 |     
  154 |     const loadTime = Date.now() - startTime;
  155 |     console.log(`Page load time: ${loadTime}ms`);
  156 |     
  157 |     expect(loadTime).toBeLessThan(15000);
  158 |   });
  159 | 
  160 |   test('large file upload should not block UI', async ({ page }) => {
  161 |     await page.goto('/converters/table');
  162 |     
  163 |     const largeFileContent = 'name,value\n' + Array(1000).fill(null).map((_, i) => `item${i},${Math.random()}`).join('\n');
  164 |     
  165 |     const fileInput = page.locator('input[type="file"]');
  166 |     await fileInput.setInputFiles({
  167 |       name: 'large-file.csv',
  168 |       mimeType: 'text/csv',
  169 |       buffer: Buffer.from(largeFileContent),
  170 |     });
  171 |     
  172 |     const loadingIndicator = page.locator('[data-testid="loading"], .loading, spinner');
  173 |     await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
  174 |     
  175 |     const result = page.locator('[data-testid="result"], .result, table');
  176 |     await expect(result).toBeVisible({ timeout: 30000 });
  177 |   });
  178 | });
  179 | 
  180 | test.describe('Form Validation', () => {
  181 |   test('required fields should show validation errors', async ({ page }) => {
  182 |     await page.goto('/login');
  183 |     
  184 |     const submitButton = page.locator('button[type="submit"]:visible').first();
  185 |     if (await submitButton.isVisible()) {
  186 |       await submitButton.click();
  187 |       
  188 |       const errorMessage = page.locator('.error-message, [role="alert"], text=Required');
  189 |       await expect(errorMessage.first()).toBeVisible();
  190 |     }
  191 |   });
  192 | 
  193 |   test('email validation should work correctly', async ({ page }) => {
  194 |     await page.goto('/login');
  195 |     
  196 |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  197 |     if (await emailInput.isVisible()) {
  198 |       await emailInput.fill('invalid-email');
```