// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 10_000,
  use: {
    // Serve the HTML file directly via the file:// protocol
    baseURL: `file://${__dirname}`,
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
