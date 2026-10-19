import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const catalog = JSON.parse(
  await readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const fixtures = JSON.parse(
  await readFile(
    new URL("./fixtures/dietary-flavors.json", import.meta.url),
    "utf8",
  ),
);
const photos = JSON.parse(
  await readFile(new URL("../src/flavorPhotos.json", import.meta.url), "utf8"),
);
const oldCatalog = JSON.stringify([
  ...fixtures,
  { ...catalog[0], name: "Old Customer Override" },
]);
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(
  (value) => localStorage.setItem("love-creamery-catalog-v1", value),
  oldCatalog,
);
await page.goto(base);
for (const selector of ["header .official-logo", ".hero-photo"])
  await page.locator(selector).evaluate((img) => img.decode());
assert.equal(await page.locator(".test-notice").count(), 1);
assert.match(
  await page.locator(".test-notice").innerText(),
  /information is not accurate/,
);
assert.match(
  await page.locator(".test-notice").innerText(),
  /Nutrition numbers and serving sizes are fictional/,
);
assert.equal(
  await page
    .getByRole("button", {
      name: /Manage catalog|Add flavor|Edit|Delete|Archive|Export JSON|Add latest shop listings/,
    })
    .count(),
  0,
);
assert.equal(
  await page.getByText("Manage catalog", { exact: true }).count(),
  0,
);
assert.equal(await page.locator("input[type=file],.editor").count(), 0);
assert.ok(
  await page.getByRole("button", { name: /Find My Flavors/ }).isDisabled(),
);
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("checkbox", { name: "Vegan", exact: true }).check();
await page.getByRole("checkbox", { name: "Gluten-free", exact: true }).check();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(
  await page.locator(".flavor").count(),
  catalog.filter((f) => f.locations.includes("canal")).length,
);
assert.equal(await page.getByLabel("Catalog entries").count(), 0);
assert.equal(
  await page
    .locator(".results .nutrition-panel,.results dl,.results figcaption")
    .count(),
  0,
);
for (const f of fixtures)
  assert.equal(
    await page
      .getByRole("button", { name: `View details for ${f.name}`, exact: true })
      .count(),
    0,
  );
assert.equal(
  await page.getByText("Old Customer Override", { exact: true }).count(),
  0,
);
const caramel = page
  .locator(".flavor")
  .filter({
    has: page.getByRole("heading", { name: "Salted Caramel", exact: true }),
  });
await caramel.locator(".flavor-photo").scrollIntoViewIfNeeded();
await caramel.locator(".flavor-photo").evaluate((img) => img.decode());
const apple = page
  .locator(".flavor")
  .filter({
    has: page.getByRole("heading", { name: "Apple Cajeta", exact: true }),
  });
assert.equal(await apple.locator(".flavor-photo").count(), 0);
assert.equal(
  await apple.getByRole("img", { name: /official photo unavailable/ }).count(),
  1,
);
const decoded = await page.evaluate(
  async (photos) =>
    Promise.all(
      photos.map(async (p) => {
        const img = new Image();
        img.src = p.path;
        await img.decode();
        return img.naturalWidth > 0;
      }),
    ),
  Object.values(photos),
);
assert.equal(decoded.length, 45);
assert.ok(decoded.every(Boolean));
const opener = caramel.getByRole("button", {
  name: "View details for Salted Caramel",
  exact: true,
});
await opener.focus();
await opener.press("Enter");
const dialog = page.getByRole("dialog", {
  name: "Salted Caramel",
  exact: true,
});
await dialog.waitFor();
for (const name of ["Canal Park", "Lincoln Park", "Billings Park"])
  assert.match(
    await dialog.getByRole("region", { name: "Store locations" }).innerText(),
    new RegExp(name),
  );
assert.match(await dialog.locator("table").innerText(), /Added sugars/);
assert.match(
  await dialog
    .locator('.ingredient-facts dt:has-text("Dyes / added colors") + dd')
    .innerText(),
  /Unknown/,
);
assert.equal(
  await dialog
    .locator(
      "input,select,textarea,.evidence-note,.detail-allergy-warning,.test-notice",
    )
    .count(),
  0,
);
assert.doesNotMatch(
  await dialog.innerText(),
  /FICTIONAL NUTRITION|invented data|not accurate/,
);
await page.keyboard.press("Shift+Tab");
assert.ok(await dialog.evaluate((d) => d.contains(document.activeElement)));
await dialog
  .getByRole("button", { name: "Close flavor details", exact: true })
  .click();
assert.ok(await opener.evaluate((el) => el === document.activeElement));
await page
  .locator("#question")
  .fill("How many calories and sugars in Salted Caramel?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
assert.match(await page.locator(".reply").innerText(), /Calories: \d+ kcal/);
assert.match(await page.locator(".reply").innerText(), /Total sugars: \d+ g/);
assert.doesNotMatch(
  await page.locator(".reply").innerText(),
  /FICTIONAL NUTRITION|invented demonstrations|not accurate/,
);
await page.locator("#question").fill("Does Salted Caramel have dyes?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
assert.match(
  await page.locator(".reply").innerText(),
  /Dyes \/ added colors: Unknown/,
);
await page.getByRole("button", { name: /Lincoln Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(
  await page.locator(".locations button[aria-pressed=true]").count(),
  2,
);
assert.equal(
  await page.locator(".flavor").count(),
  catalog.filter((f) =>
    f.locations.some((id) => ["canal", "lincoln"].includes(id)),
  ).length,
);
assert.equal(
  await page
    .getByRole("button", {
      name: "View details for Salted Caramel",
      exact: true,
    })
    .count(),
  1,
);
await page.locator("#question").fill("How much protein in Vegan Vanilla?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
assert.match(await page.locator(".reply").innerText(), /Vegan Vanilla/);
await page.getByRole("button", { name: /Billings Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.locator(".flavor").count(), 46);
await page
  .getByLabel("Search flavor names", { exact: true })
  .fill("Coconut Cocoa");
assert.equal(await page.locator(".flavor").count(), 0);
await page
  .getByLabel("Search flavor names", { exact: true })
  .fill("Old Customer Override");
assert.equal(await page.locator(".flavor").count(), 0);
await page
  .getByLabel("Search flavor names", { exact: true })
  .fill("Salted Caramel");
assert.equal(await page.locator(".flavor").count(), 2);
await page
  .getByRole("button", { name: "Reset filters ↺", exact: true })
  .click();
assert.ok(
  await page.getByRole("button", { name: /Find My Flavors/ }).isDisabled(),
);
assert.ok(
  await page.getByRole("button", { name: "Ask →", exact: true }).isDisabled(),
);
// Reload ignores old customer edits and keeps the original storage intact.
await page.reload();
assert.equal(
  await page.evaluate(() => localStorage.getItem("love-creamery-catalog-v1")),
  oldCatalog,
);
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("button", { name: /Lincoln Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
await page
  .getByLabel("Search flavor names", { exact: true })
  .fill("Salted Caramel");
const mobileOpener = page.getByRole("button", {
  name: "View details for Salted Caramel",
  exact: true,
});
await mobileOpener.click();
const mobileDialog = page.getByRole("dialog", {
  name: "Salted Caramel",
  exact: true,
});
assert.ok(await mobileDialog.evaluate((d) => d.scrollWidth <= d.clientWidth));
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").count(), 0);
assert.ok(await mobileOpener.evaluate((el) => el === document.activeElement));
await mobileOpener.click();
await page.mouse.click(1, 1);
assert.equal(await page.getByRole("dialog").count(), 0);
await page.getByLabel("Search flavor names", { exact: true }).fill("Chocolate");
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: join(tmpdir(), "love-mobile.png"),
  fullPage: true,
});
await page.setViewportSize({ width: 1400, height: 1000 });
await page.screenshot({
  path: join(tmpdir(), "love-desktop.png"),
  fullPage: true,
});
assert.equal(
  await page.evaluate(() => localStorage.getItem("love-creamery-catalog-v1")),
  oldCatalog,
);
const broken = await browser.newPage();
await broken.route("**/flavors/lc-salted-caramel.jpg", (route) =>
  route.abort(),
);
await broken.goto(base);
await broken.getByRole("button", { name: /Canal Park/ }).click();
await broken.getByRole("button", { name: /Find My Flavors/ }).click();
await broken
  .getByLabel("Search flavor names", { exact: true })
  .fill("Salted Caramel");
const brokenCard = broken.getByRole("button", {
  name: "View details for Salted Caramel",
  exact: true,
});
await brokenCard.scrollIntoViewIfNeeded();
await brokenCard
  .getByRole("img", { name: /official photo unavailable/ })
  .waitFor();
await brokenCard.click();
const brokenDialog = broken.getByRole("dialog", {
  name: "Salted Caramel",
  exact: true,
});
await brokenDialog
  .getByText("Illustration — official flavor photo unavailable", {
    exact: true,
  })
  .waitFor();
await brokenDialog
  .getByRole("button", { name: "Ask about this flavor →", exact: true })
  .click();
assert.equal(await broken.getByRole("dialog").count(), 0);
assert.match(await broken.locator(".reply").innerText(), /Salted Caramel/);
await broken.close();
assert.deepEqual(errors, []);
console.log(
  "Browser checks passed: read-only customer catalog, no fictional entries or legacy overrides, one main-page disclaimer, multiple locations, dietary groups, compact cards, nutrition and store details, keyboard/mobile dialogs, assistant, all 45 photos and fallback.",
);
await browser.close();
