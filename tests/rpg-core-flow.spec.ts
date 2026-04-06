import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:8080';
const TEST_USER = `testuser_${Math.floor(Math.random() * 10000)}`;
const TEST_PASS = 'password123';

test.describe('Saber RPG Core Flow', () => {
  
  test('should complete the full RPG loop: register -> gacha -> equip -> scale stats', async ({ page }) => {
    // 1. Register a new user
    await page.goto(`${BASE_URL}/auth`);
    await page.click('button:has-text("Tạo Tài Khoản")');
    await page.fill('input[placeholder="VD: saber123"]', TEST_USER);
    await page.fill('input[placeholder="••••••••"]', TEST_PASS);
    await page.click('button[type="submit"]');

    // Wait for redirect to Main Menu
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.locator('text=Saber')).toBeVisible();

    // 2. Go to Gacha and roll
    // Find Gacha menu item (Main Menu has Gacha button)
    await page.click('text=Gacha');
    await expect(page).toHaveURL(`${BASE_URL}/gacha`);
    
    // Perform x10 roll (assuming enough KC from registration)
    await page.click('button:has-text("Triệu Hồi x10")');
    
    // Wait for gacha animation/results
    await page.waitForTimeout(2000); // Wait for results to appear
    await expect(page.locator('button:has-text("Xác nhận")')).toBeVisible();
    await page.click('button:has-text("Xác nhận")');

    // 3. Go to Bag and verify items
    await page.click('text=Thùng Đồ Toàn Cầu');
    await expect(page).toHaveURL(`${BASE_URL}/bag`);
    
    // Check if we have at least some items in the equipment list
    const items = page.locator('.grid-cols-4 > div');
    const count = await items.count();
    console.log(`Found ${count} items in bag`);
    expect(count).toBeGreaterThan(0);

    // 4. Go to Character and Equip
    await page.click('text=Character');
    await expect(page).toHaveURL(`${BASE_URL}/character`);
    
    // Get initial CP
    const cpText = await page.locator('text=Lực chiến:').textContent();
    const initialCP = parseInt(cpText?.replace(/[^0-9]/g, '') || '0');
    console.log('Initial CP:', initialCP);

    // Click on an equipment slot (e.g., Armor)
    // Looking for a slot labeled "Trống" (Empty)
    await page.click('text=Trống'); 
    
    // Select the first available item in the modal
    await page.waitForSelector('.fixed.inset-0.bg-black\\/90'); // Modal open
    const availableItems = page.locator('button:has-text("Gắn")');
    if (await availableItems.count() > 0) {
      await availableItems.first().click();
      
      // Verify CP increased
      await page.waitForTimeout(1000); // Wait for hydration/sync
      const newCpText = await page.locator('text=Lực chiến:').textContent();
      const newCP = parseInt(newCpText?.replace(/[^0-9]/g, '') || '0');
      console.log('New CP:', newCP);
      expect(newCP).toBeGreaterThan(initialCP);
    } else {
      console.log('No compatible items found to equip during test.');
    }
  });

  test('should load battle and show combatants', async ({ page }) => {
    // Reuse the previous state if possible, but Playwright tests are isolated.
    await page.goto(`${BASE_URL}/auth`);
    // Login with the created user
    await page.fill('input[placeholder="VD: saber123"]', TEST_USER);
    await page.fill('input[placeholder="••••••••"]', TEST_PASS);
    await page.click('button[type="submit"]');

    await page.click('text=Battle Zone');
    await expect(page).toHaveURL(`${BASE_URL}/battle`); 
    
    // Select a level
    await page.click('text=Ải 1');
    
    // Verify preparation phase
    await expect(page.locator('text=CHUẨN BỊ CHIẾN ĐẤU')).toBeVisible();
    
    // Start Battle
    await page.click('button:has-text("VÀO TRẬN")');
    
    // Verify combat state
    await expect(page.locator('video')).toBeVisible(); // Check for background video or avatar videos
  });
});
