import { chromium } from 'playwright';

const url = 'http://localhost:4000/crm/#/dashboard/visibilityTest';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForURL(/\/login\.html$/, { timeout: 8000 });
  const href = page.url();
  if (!href.includes('/login.html')) {
    throw new Error('Expected redirect to login.html, got ' + href);
  }
  console.log('VISIBILITY_TEST_PASSED');
  process.exit(0);
} catch (err) {
  console.error('VISIBILITY_TEST_FAILED:', err.message);
  process.exit(1);
} finally {
  await browser.close();
}
