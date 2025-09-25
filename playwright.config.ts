import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

const flagEntries = (process.env.NEXT_PUBLIC_FLAGS ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

if (!flagEntries.some((entry) => entry.startsWith('nav.reviewFreeze='))) {
  flagEntries.push('nav.reviewFreeze=true');
}

process.env.NEXT_PUBLIC_FLAGS = flagEntries.join(',');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_FLAGS: process.env.NEXT_PUBLIC_FLAGS,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
