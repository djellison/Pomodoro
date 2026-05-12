// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '../pomodoro.html')}`;

// Helper: install fake timers and patch setInterval so ticks are driven manually
async function installFakeTimers(page) {
  await page.addInitScript(() => {
    window.__ticks = 0;
    const _setInterval = window.setInterval.bind(window);
    const _clearInterval = window.clearInterval.bind(window);
    let _id = null;
    let _cb = null;

    window.setInterval = (cb, ms) => {
      _cb = cb;
      _id = _setInterval(() => {}, 999999); // dummy so clearInterval still works
      return _id;
    };
    window.clearInterval = (id) => {
      _cb = null;
      _clearInterval(id);
    };

    // Exposed globally so tests can drive ticks
    window.__tick = () => { if (_cb) _cb(); };
  });
}

test.describe('Initial state', () => {
  test('displays 25:00 on load', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#display')).toHaveText('25:00');
  });

  test('phase label reads "Focus"', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#phase')).toHaveText('Focus');
  });

  test('Start button is visible', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#btn-start')).toHaveText('Start');
  });

  test('session count starts at 0', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#session-count')).toHaveText('0');
  });

  test('minutes input defaults to 25', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#custom-minutes')).toHaveValue('25');
  });

  test('no dots are filled on load', async ({ page }) => {
    await page.goto(FILE_URL);
    const filled = page.locator('.dot.filled');
    await expect(filled).toHaveCount(0);
  });
});

test.describe('Start / Pause / Resume', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeTimers(page);
    await page.goto(FILE_URL);
  });

  test('clicking Start changes button to Pause', async ({ page }) => {
    await page.click('#btn-start');
    await expect(page.locator('#btn-start')).toHaveText('Pause');
  });

  test('clicking Start changes phase to Focus', async ({ page }) => {
    await page.click('#btn-start');
    await expect(page.locator('#phase')).toHaveText('Focus');
  });

  test('timer counts down one second per tick', async ({ page }) => {
    await page.click('#btn-start');
    await page.evaluate(() => window.__tick());
    await expect(page.locator('#display')).toHaveText('24:59');
  });

  test('timer counts down multiple ticks correctly', async ({ page }) => {
    await page.click('#btn-start');
    await page.evaluate(() => { for (let i = 0; i < 61; i++) window.__tick(); });
    await expect(page.locator('#display')).toHaveText('23:59');
  });

  test('clicking Pause stops the countdown', async ({ page }) => {
    await page.click('#btn-start');
    await page.evaluate(() => window.__tick());
    await page.click('#btn-start'); // Pause
    await expect(page.locator('#btn-start')).toHaveText('Resume');
    await expect(page.locator('#phase')).toHaveText('Paused');
    // Further ticks should not change the display
    await page.evaluate(() => window.__tick());
    await expect(page.locator('#display')).toHaveText('24:59');
  });

  test('clicking Resume continues countdown', async ({ page }) => {
    await page.click('#btn-start');
    await page.evaluate(() => window.__tick());
    await page.click('#btn-start'); // Pause
    await page.click('#btn-start'); // Resume
    await expect(page.locator('#btn-start')).toHaveText('Pause');
    await page.evaluate(() => window.__tick());
    await expect(page.locator('#display')).toHaveText('24:58');
  });

  test('minutes input is disabled while running', async ({ page }) => {
    await page.click('#btn-start');
    await expect(page.locator('#custom-minutes')).toBeDisabled();
  });
});

test.describe('Reset', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeTimers(page);
    await page.goto(FILE_URL);
  });

  test('Reset restores display to 25:00', async ({ page }) => {
    await page.click('#btn-start');
    await page.evaluate(() => { for (let i = 0; i < 30; i++) window.__tick(); });
    await page.click('#btn-reset');
    await expect(page.locator('#display')).toHaveText('25:00');
  });

  test('Reset restores Start button label', async ({ page }) => {
    await page.click('#btn-start');
    await page.click('#btn-reset');
    await expect(page.locator('#btn-start')).toHaveText('Start');
  });

  test('Reset re-enables the minutes input', async ({ page }) => {
    await page.click('#btn-start');
    await page.click('#btn-reset');
    await expect(page.locator('#custom-minutes')).toBeEnabled();
  });

  test('Reset restores phase label to Focus', async ({ page }) => {
    await page.click('#btn-start');
    await page.click('#btn-reset');
    await expect(page.locator('#phase')).toHaveText('Focus');
  });
});

test.describe('Custom duration', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeTimers(page);
    await page.goto(FILE_URL);
  });

  test('changing minutes input updates the display', async ({ page }) => {
    await page.fill('#custom-minutes', '5');
    await page.press('#custom-minutes', 'Tab');
    await expect(page.locator('#display')).toHaveText('05:00');
  });

  test('custom duration counts down correctly', async ({ page }) => {
    await page.fill('#custom-minutes', '1');
    await page.press('#custom-minutes', 'Tab');
    await page.click('#btn-start');
    await page.evaluate(() => window.__tick());
    await expect(page.locator('#display')).toHaveText('00:59');
  });

  test('input value is clamped to minimum of 1', async ({ page }) => {
    await page.fill('#custom-minutes', '0');
    await page.press('#custom-minutes', 'Tab');
    await expect(page.locator('#custom-minutes')).toHaveValue('1');
  });

  test('input value is clamped to maximum of 99', async ({ page }) => {
    await page.fill('#custom-minutes', '150');
    await page.press('#custom-minutes', 'Tab');
    await expect(page.locator('#custom-minutes')).toHaveValue('99');
  });
});

test.describe('Session completion', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeTimers(page);
    await page.goto(FILE_URL);
  });

  async function runFullSession(page, minutes = 1) {
    await page.fill('#custom-minutes', String(minutes));
    await page.press('#custom-minutes', 'Tab');
    await page.click('#btn-start');
    const ticks = minutes * 60;
    await page.evaluate((n) => { for (let i = 0; i < n; i++) window.__tick(); }, ticks);
  }

  test('display shows 00:00 when timer finishes', async ({ page }) => {
    await runFullSession(page);
    await expect(page.locator('#display')).toHaveText('00:00');
  });

  test('phase label shows Complete! when done', async ({ page }) => {
    await runFullSession(page);
    await expect(page.locator('#phase')).toHaveText('Complete!');
  });

  test('Start button becomes Restart after completion', async ({ page }) => {
    await runFullSession(page);
    await expect(page.locator('#btn-start')).toHaveText('Restart');
  });

  test('session count increments by 1', async ({ page }) => {
    await runFullSession(page);
    await expect(page.locator('#session-count')).toHaveText('1');
  });

  test('one dot fills after first session', async ({ page }) => {
    await runFullSession(page);
    await expect(page.locator('.dot.filled')).toHaveCount(1);
  });

  test('Restart begins a new countdown', async ({ page }) => {
    await runFullSession(page);
    await page.click('#btn-start'); // Restart
    await page.evaluate(() => window.__tick());
    await expect(page.locator('#display')).toHaveText('00:59');
  });
});
