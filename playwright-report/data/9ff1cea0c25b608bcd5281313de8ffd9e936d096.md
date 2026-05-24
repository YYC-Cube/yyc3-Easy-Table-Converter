# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flows.spec.ts >> User Interface & Accessibility >> error boundary should catch errors gracefully
- Location: e2e/core-flows.spec.ts:138:7

# Error details

```
ReferenceError: jest is not defined
```

# Test source

```ts
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
  98  |     await fileInput.setInputFiles({
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
> 139 |     console.log = jest.fn();
      |                   ^ ReferenceError: jest is not defined
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
  199 |       await emailInput.blur();
  200 |       
  201 |       const emailError = page.locator(':text("email"), :text("valid")');
  202 |       if (await emailError.isVisible()) {
  203 |         expect(emailError).toContainText(/invalid|valid|email/i);
  204 |       }
  205 |     }
  206 |   });
  207 | });
  208 | 
```