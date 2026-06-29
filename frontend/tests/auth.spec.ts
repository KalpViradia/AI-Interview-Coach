import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can navigate to login and register pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    
    // Expect the title to contain AI Interview Coach
    await expect(page).toHaveTitle(/AI Interview Coach|Create Next App/);
    
    // Check if the Sign In button is present in navbar or hero
    // Since user is not logged in, we should see "Log In" or "Sign In"
    const loginLink = page.getByRole('link', { name: /Log In|Sign In/i });
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/.*\/login/);
    } else {
      // If direct navigation is needed
      await page.goto('/login');
    }
    
    // Verify login page elements
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/name@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/i)).toBeVisible();
    
    // Verify link to register
    const registerLink = page.getByRole('link', { name: /Sign up/i });
    await registerLink.click();
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();
  });
});
