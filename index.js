require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, message: "Jeunique automation backend is running." });
});

app.post('/api/analyze', async (req, res) => {
  const { clientName, skin, hair, eyes, gender = "F" } = req.body;

  if (!clientName || !skin || !hair || !eyes) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields"
    });
  }

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(process.env.JEUNIQUE_URL, { waitUntil: "domcontentloaded" });

    await page.fill('input[name="account"]', process.env.JEUNIQUE_USERNAME);
    await page.fill('input[name="psword"]', process.env.JEUNIQUE_PASSWORD);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click('input[type="submit"]')
    ]);

    await page.click('a.mainmenu:has-text("Color Alliance")');
    await page.waitForSelector('#BFAS', { state: 'visible' });

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click('a.submenu:has-text("Let\'s Do Color")')
    ]);

    await page.fill('input[name="cname"]', clientName);
    await page.selectOption('select[name="sex"]', gender);
    await page.fill('input[name="skin"]', skin);
    await page.fill('input[name="hair"]', hair);
    await page.fill('input[name="eye"]', eyes);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click('input[type="submit"][value="Let\'s Do Color Alliance"]')
    ]);

    const resultLocator = page.locator('font[size="6"]');
    const result = (await resultLocator.first().innerText()).trim();

    return res.json({ success: true, result });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Automation engine running on " + PORT);
});
