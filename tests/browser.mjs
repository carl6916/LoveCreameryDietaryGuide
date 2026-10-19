import { chromium } from "playwright";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifact = (name) => join(tmpdir(), name);
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:5173");
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("checkbox", { name: "Vegan", exact: true }).check();
await page.getByRole("checkbox", { name: "Gluten-free", exact: true }).check();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.locator(".flavor").count(), 3);
assert.equal(
  await page
    .locator(".results>div")
    .filter({ has: page.getByRole("heading", { name: /Matches documented/ }) })
    .locator(".flavor")
    .count(),
  2,
);
await page
  .getByRole("checkbox", { name: "Dairy / milk allergy", exact: true })
  .check();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(
  await page
    .locator(".results>div")
    .filter({ has: page.getByRole("heading", { name: /Needs confirmation/ }) })
    .locator(".flavor")
    .count(),
  1,
);
await page.getByRole("button", { name: /Billings Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.locator(".flavor").count(), 3);
assert.equal(
  await page.locator(".flavor").filter({ hasText: "Coconut Cocoa" }).count(),
  0,
);
await page
  .getByLabel("Ask the flavor guide")
  .fill("Does Vanilla Bean contain eggs?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
await page.locator(".reply").waitFor();
assert.match(await page.locator(".reply").innerText(), /egg: contains/);
await page.getByRole("button", { name: "Manage catalog", exact: true }).click();
await page.getByRole("button", { name: "+ Add flavor" }).click();
await page
  .locator(".editor")
  .getByLabel("name", { exact: true })
  .fill("Browser Test Scoop");
await page.locator(".editor").getByLabel("Canal Park", { exact: true }).check();
await page.getByRole("button", { name: "Save flavor", exact: true }).click();
assert.equal(
  await page
    .locator(".manage-row")
    .filter({ hasText: "Browser Test Scoop" })
    .count(),
  1,
);
await page.reload();
await page.getByRole("button", { name: "Manage catalog", exact: true }).click();
assert.equal(
  await page
    .locator(".manage-row")
    .filter({ hasText: "Browser Test Scoop" })
    .count(),
  1,
);
await page
  .locator(".manage-row")
  .filter({ hasText: "Browser Test Scoop" })
  .getByRole("button", { name: "Edit", exact: true })
  .click();
await page
  .locator(".editor")
  .getByLabel("name", { exact: true })
  .fill("Edited Browser Scoop");
await page.getByRole("button", { name: "Save flavor", exact: true }).click();
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export JSON ↓" }).click();
const download = await downloadPromise;
await download.saveAs(artifact("love-export.json"));
page.on("dialog", (d) => d.accept());
await page
  .locator(".manage-row")
  .filter({ hasText: "Edited Browser Scoop" })
  .getByRole("button", { name: "Delete", exact: true })
  .click();
assert.equal(
  await page
    .locator(".manage-row")
    .filter({ hasText: "Edited Browser Scoop" })
    .count(),
  0,
);
await page
  .locator("input[type=file]")
  .setInputFiles(artifact("love-export.json"));
await page.getByText("Edited Browser Scoop", { exact: true }).waitFor();
await page
  .locator("input[type=file]")
  .setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("[{}]"),
  });
await page
  .getByRole("status")
  .filter({ hasText: /Invalid catalog/ })
  .waitFor();
assert.equal(await page.locator(".manage-row").count(), 5);
await page
  .locator(".manage-row")
  .filter({ hasText: "Edited Browser Scoop" })
  .getByRole("button", { name: "Archive", exact: true })
  .click();
assert.match(await page.locator(".manage-row").last().innerText(), /archived/);
await page
  .getByRole("button", { name: "Find your flavors", exact: true })
  .click();
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.locator(".flavor").count(), 3);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: artifact("love-mobile.png"), fullPage: true });
await page.setViewportSize({ width: 1400, height: 1000 });
await page.screenshot({ path: artifact("love-desktop.png"), fullPage: true });
assert.deepEqual(errors, []);
console.log(
  "Browser checks passed: filters, location switching, ingredient question, add/edit/archive/delete, refresh persistence, JSON roundtrip, invalid import, mobile overflow, no runtime errors.",
);
await browser.close();
