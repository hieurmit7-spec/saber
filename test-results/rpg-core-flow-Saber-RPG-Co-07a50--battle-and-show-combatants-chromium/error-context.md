# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rpg-core-flow.spec.ts >> Saber RPG Core Flow >> should load battle and show combatants
- Location: tests\rpg-core-flow.spec.ts:75:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Battle Zone')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e8]:
      - heading "FERN" [level=1] [ref=e9]
      - paragraph [ref=e10]: Saber's Legacy · Turn-Based RPG
    - generic [ref=e13]:
      - generic [ref=e14]:
        - button "Đăng Nhập" [ref=e15] [cursor=pointer]
        - button "Tạo Tài Khoản" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Tên Đăng Nhập
          - 'textbox "VD: saber123" [ref=e20]': testuser_6598
        - generic [ref=e21]:
          - generic [ref=e22]: Mật Khẩu
          - textbox "••••••••" [ref=e23]: password123
        - button "Đăng Nhập" [ref=e24] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Configuration
  4  | const BASE_URL = 'http://localhost:8080';
  5  | const TEST_USER = `testuser_${Math.floor(Math.random() * 10000)}`;
  6  | const TEST_PASS = 'password123';
  7  | 
  8  | test.describe('Saber RPG Core Flow', () => {
  9  |   
  10 |   test('should complete the full RPG loop: register -> gacha -> equip -> scale stats', async ({ page }) => {
  11 |     // 1. Register a new user
  12 |     await page.goto(`${BASE_URL}/auth`);
  13 |     await page.click('button:has-text("Tạo Tài Khoản")');
  14 |     await page.fill('input[placeholder="VD: saber123"]', TEST_USER);
  15 |     await page.fill('input[placeholder="••••••••"]', TEST_PASS);
  16 |     await page.click('button[type="submit"]');
  17 | 
  18 |     // Wait for redirect to Main Menu
  19 |     await expect(page).toHaveURL(`${BASE_URL}/`);
  20 |     await expect(page.locator('text=Saber')).toBeVisible();
  21 | 
  22 |     // 2. Go to Gacha and roll
  23 |     // Find Gacha menu item (Main Menu has Gacha button)
  24 |     await page.click('text=Gacha');
  25 |     await expect(page).toHaveURL(`${BASE_URL}/gacha`);
  26 |     
  27 |     // Perform x10 roll (assuming enough KC from registration)
  28 |     await page.click('button:has-text("Triệu Hồi x10")');
  29 |     
  30 |     // Wait for gacha animation/results
  31 |     await page.waitForTimeout(2000); // Wait for results to appear
  32 |     await expect(page.locator('button:has-text("Xác nhận")')).toBeVisible();
  33 |     await page.click('button:has-text("Xác nhận")');
  34 | 
  35 |     // 3. Go to Bag and verify items
  36 |     await page.click('text=Thùng Đồ Toàn Cầu');
  37 |     await expect(page).toHaveURL(`${BASE_URL}/bag`);
  38 |     
  39 |     // Check if we have at least some items in the equipment list
  40 |     const items = page.locator('.grid-cols-4 > div');
  41 |     const count = await items.count();
  42 |     console.log(`Found ${count} items in bag`);
  43 |     expect(count).toBeGreaterThan(0);
  44 | 
  45 |     // 4. Go to Character and Equip
  46 |     await page.click('text=Character');
  47 |     await expect(page).toHaveURL(`${BASE_URL}/character`);
  48 |     
  49 |     // Get initial CP
  50 |     const cpText = await page.locator('text=Lực chiến:').textContent();
  51 |     const initialCP = parseInt(cpText?.replace(/[^0-9]/g, '') || '0');
  52 |     console.log('Initial CP:', initialCP);
  53 | 
  54 |     // Click on an equipment slot (e.g., Armor)
  55 |     // Looking for a slot labeled "Trống" (Empty)
  56 |     await page.click('text=Trống'); 
  57 |     
  58 |     // Select the first available item in the modal
  59 |     await page.waitForSelector('.fixed.inset-0.bg-black\\/90'); // Modal open
  60 |     const availableItems = page.locator('button:has-text("Gắn")');
  61 |     if (await availableItems.count() > 0) {
  62 |       await availableItems.first().click();
  63 |       
  64 |       // Verify CP increased
  65 |       await page.waitForTimeout(1000); // Wait for hydration/sync
  66 |       const newCpText = await page.locator('text=Lực chiến:').textContent();
  67 |       const newCP = parseInt(newCpText?.replace(/[^0-9]/g, '') || '0');
  68 |       console.log('New CP:', newCP);
  69 |       expect(newCP).toBeGreaterThan(initialCP);
  70 |     } else {
  71 |       console.log('No compatible items found to equip during test.');
  72 |     }
  73 |   });
  74 | 
  75 |   test('should load battle and show combatants', async ({ page }) => {
  76 |     // Reuse the previous state if possible, but Playwright tests are isolated.
  77 |     await page.goto(`${BASE_URL}/auth`);
  78 |     // Login with the created user
  79 |     await page.fill('input[placeholder="VD: saber123"]', TEST_USER);
  80 |     await page.fill('input[placeholder="••••••••"]', TEST_PASS);
  81 |     await page.click('button[type="submit"]');
  82 | 
> 83 |     await page.click('text=Battle Zone');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  84 |     await expect(page).toHaveURL(`${BASE_URL}/battle`); 
  85 |     
  86 |     // Select a level
  87 |     await page.click('text=Ải 1');
  88 |     
  89 |     // Verify preparation phase
  90 |     await expect(page.locator('text=CHUẨN BỊ CHIẾN ĐẤU')).toBeVisible();
  91 |     
  92 |     // Start Battle
  93 |     await page.click('button:has-text("VÀO TRẬN")');
  94 |     
  95 |     // Verify combat state
  96 |     await expect(page.locator('video')).toBeVisible(); // Check for background video or avatar videos
  97 |   });
  98 | });
  99 | 
```