import { expect, test } from '@playwright/test';

test.describe('form builder demo', () => {
  test('loads the demo form and advances to employment step', async ({ page }) => {
    await page.goto('/demo');

    await expect(page.getByRole('heading', { name: 'Employment Application Demo' })).toBeVisible();

    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Date of birth').fill('1990-01-01');

    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Employment Status' })).toBeVisible();
  });
});
