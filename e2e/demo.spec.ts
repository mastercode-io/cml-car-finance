import { expect, test, type Locator, type Page } from '@playwright/test';

const focusWithKeyboard = async (page: Page, target: Locator) => {
  const isFocused = async (): Promise<boolean> => {
    try {
      return await target.evaluate((element) => element === document.activeElement);
    } catch {
      return false;
    }
  };

  let isTargetVisible = false;
  try {
    isTargetVisible = await target.isVisible({ timeout: 0 });
  } catch {
    isTargetVisible = false;
  }

  if (isTargetVisible && (await isFocused())) {
    return;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab');
    if (await isFocused()) {
      return;
    }
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Shift+Tab');
    if (await isFocused()) {
      return;
    }
  }

  throw new Error('Unable to focus target via keyboard interactions');
};

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

  test('keyboard-only review freeze flow reaches review and stays there', async ({ page }) => {
    await page.goto('/demo/review-freeze');

    await expect(page.getByRole('heading', { name: 'Review Freeze Demo' })).toBeVisible();

    await page.keyboard.press('Tab');
    const firstNameInput = page.getByLabel('First name');
    await expect(firstNameInput).toBeFocused();
    await page.keyboard.type('Ada');

    await page.keyboard.press('Tab');
    const detailsNext = page.getByRole('button', { name: 'Next' });
    await expect(detailsNext).toBeFocused();
    await page.keyboard.press('Enter');

    const reviewHeading = page.getByRole('heading', { name: 'Review & Submit' });
    await expect(reviewHeading).toBeVisible();

    const reviewNext = page.getByRole('button', { name: 'Next' });
    const previousButton = page.getByRole('button', { name: 'Previous' });
    const confirmCheckbox = page.getByLabel('I confirm this application is accurate');

    await focusWithKeyboard(page, reviewNext);
    await expect(reviewNext).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(confirmCheckbox).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(previousButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(confirmCheckbox).toBeFocused();

    await page.keyboard.press('Space');
    await expect(confirmCheckbox).toHaveAttribute('data-state', 'checked');

    await page.keyboard.press('Tab');
    await expect(reviewNext).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(reviewHeading).toBeVisible();
    await expect(reviewNext).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Confirmation' })).toHaveCount(0);
  });
});
