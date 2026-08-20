import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "screenshot");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3458";

const VIEWS = [
  { tab: "dashboard", file: "dashboard", wait: 800 },
  { tab: "mouse", file: "mouse", wait: 800 },
  { tab: "keyboard", file: "keyboard", wait: 800 },
  { tab: "gamepad", file: "gamepad", wait: 800 },
  { tab: "display", file: "display", wait: 800 },
  { tab: "network", file: "network", wait: 800 },
  { tab: "benchmark", file: "benchmark", wait: 800 },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(700);

for (const { tab, file, wait } of VIEWS) {
  await page.click(`[data-tab="${tab}"]`, { timeout: 15000 });
  await page.waitForFunction(
    (t) => document.getElementById(`tab-${t}`)?.classList.contains("active"),
    tab,
    { timeout: 15000 }
  );
  await page.waitForTimeout(wait);
  const outFile = join(OUT, `${file}.png`);
  await page.screenshot({ path: outFile, fullPage: false });
  console.log("saved", outFile);
}

await browser.close();
