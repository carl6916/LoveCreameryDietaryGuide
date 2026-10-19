import { chromium } from "playwright";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifact = (name) => join(tmpdir(), name);
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const defaultCatalog = JSON.parse(
  await readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const initialSize = defaultCatalog.length;
const photoMetadata = JSON.parse(
  await readFile(new URL("../src/flavorPhotos.json", import.meta.url), "utf8"),
);
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:5173");
for (const selector of ["header .official-logo", ".hero-photo"]) {
  const image = page.locator(selector);
  await image.waitFor();
  await image.evaluate((img) => img.decode());
  assert.ok(
    await image.evaluate((img) => img.naturalWidth > 0),
    `${selector} must load`,
  );
}

await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("checkbox", { name: "Vegan", exact: true }).check();
await page.getByRole("checkbox", { name: "Gluten-free", exact: true }).check();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.getByLabel("Catalog entries").inputValue(), "official");
const caramel = page.locator(".flavor").filter({
  has: page.getByRole("heading", { name: "Salted Caramel", exact: true }),
});
await caramel.locator(".flavor-photo").scrollIntoViewIfNeeded();
await caramel.locator(".flavor-photo").evaluate((img) => img.decode());
assert.match(
  await caramel.locator(".flavor-photo").getAttribute("src"),
  /flavors\/lc-salted-caramel\.jpg$/,
);
const apple = page.locator(".flavor").filter({
  has: page.getByRole("heading", { name: "Apple Cajeta", exact: true }),
});
assert.equal(await apple.locator(".flavor-photo").count(), 0);
assert.equal(
  await apple.getByRole("img", { name: /official photo unavailable/ }).count(),
  1,
);
const decodedPhotos = await page.evaluate(async (photos) => {
  return await Promise.all(
    photos.map(async (photo) => {
      const img = new Image();
      img.src = photo.path;
      await img.decode();
      return img.naturalWidth > 0 && img.naturalHeight > 0;
    }),
  );
}, Object.values(photoMetadata));
assert.equal(decodedPhotos.length, 45);
assert.ok(decodedPhotos.every(Boolean));
// Result cards contain only image, name and description; all detail is in a modal.
assert.equal(await page.locator(".results .nutrition-panel").count(), 0);
assert.equal(await caramel.locator("dl, .badges, figcaption").count(), 0);
const caramelButton = caramel.getByRole("button", {
  name: "View details for Salted Caramel",
  exact: true,
});
await caramelButton.focus();
await caramelButton.press("Enter");
const dialog = page.getByRole("dialog", {
  name: "Salted Caramel",
  exact: true,
});
await dialog.waitFor();
assert.match(
  await dialog.locator(".nutrition-panel").innerText(),
  /FICTIONAL NUTRITION/,
);
assert.match(await dialog.locator("table").innerText(), /Added sugars/);
assert.match(
  await dialog
    .locator('.ingredient-facts dt:has-text("Dyes / added colors") + dd')
    .innerText(),
  /Unknown/,
);
for (const name of ["Canal Park", "Lincoln Park", "Billings Park"])
  assert.match(
    await dialog.getByRole("region", { name: "Store locations" }).innerText(),
    new RegExp(name),
  );
assert.match(
  await dialog.locator(".detail-allergy-warning").innerText(),
  /Cross-contact/,
);
await page.keyboard.press("Shift+Tab");
assert.ok(await dialog.evaluate((d) => d.contains(document.activeElement)));
await dialog
  .getByRole("button", { name: "Close flavor details", exact: true })
  .click();
assert.equal(await page.getByRole("dialog").count(), 0);
assert.ok(await caramelButton.evaluate((el) => document.activeElement === el));
await page
  .locator("#question")
  .fill("How many calories and sugars in Salted Caramel?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
assert.match(await page.locator(".reply").innerText(), /FICTIONAL NUTRITION/);
// Adding a shop uses OR semantics, and a shared flavor appears only once.
await page.getByRole("button", { name: /Lincoln Park/ }).click();
assert.equal(
  await page.locator(".locations button[aria-pressed=true]").count(),
  2,
);
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(
  await page.locator(".flavor").count(),
  defaultCatalog.filter(
    (f) =>
      !f.demo && f.locations.some((id) => ["canal", "lincoln"].includes(id)),
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
await page.getByRole("button", { name: /Lincoln Park/ }).click();
await page.getByRole("button", { name: /Canal Park/ }).click();
assert.ok(
  await page.getByRole("button", { name: /Find My Flavors/ }).isDisabled(),
);
assert.ok(
  await page.getByRole("button", { name: "Ask →", exact: true }).isDisabled(),
);
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
await page.getByLabel("Catalog entries").selectOption("demo");
assert.equal(await page.locator(".flavor").count(), 3);
assert.equal(await page.locator(".flavor-photo").count(), 0);
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
assert.equal(await page.locator(".flavor").count(), 4);
assert.equal(
  await page
    .getByRole("button", { name: "View details for Vanilla Bean", exact: true })
    .count(),
  1,
);
await page.getByRole("button", { name: /Canal Park/ }).click();
await page.getByRole("button", { name: /Find My Flavors/ }).click();
assert.equal(await page.locator(".flavor").count(), 3);
assert.equal(
  await page.locator(".flavor").filter({ hasText: "Coconut Cocoa" }).count(),
  0,
);
await page.locator("#question").fill("Does Vanilla Bean contain eggs?");
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
await page
  .getByLabel("Nutrition evidence", { exact: true })
  .selectOption("fictional");
await page
  .getByLabel("Serving description", { exact: true })
  .fill("Browser test serving");
await page.getByLabel("Serving weight (g)", { exact: true }).fill("100");
await page.getByLabel("Calories (kcal)", { exact: true }).fill("210");
await page.getByLabel("Total carbohydrates (g)", { exact: true }).fill("26");
await page.getByLabel("Total sugars (g)", { exact: true }).fill("20");
await page.getByLabel("Added sugars (g)", { exact: true }).fill("16");
await page.getByLabel("Protein (g)", { exact: true }).fill("3");
await page
  .getByLabel("Dyes / added colors evidence", { exact: true })
  .selectOption("fictional");
await page
  .getByLabel("Dyes / added colors", { exact: true })
  .fill("Example dye for browser test");
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
assert.equal(
  await page.getByLabel("Calories (kcal)", { exact: true }).inputValue(),
  "210",
);
assert.equal(
  await page.getByLabel("Dyes / added colors", { exact: true }).inputValue(),
  "Example dye for browser test",
);
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
const restored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("love-creamery-catalog-v1")).find(
    (f) => f.name === "Edited Browser Scoop",
  ),
);
assert.equal(restored.nutrition.calories, 210);
assert.equal(restored.nutrition.status, "fictional");
assert.equal(
  restored.ingredientInfo.fields.dyes.value,
  "Example dye for browser test",
);
await page.locator("input[type=file]").setInputFiles({
  name: "bad.json",
  mimeType: "application/json",
  buffer: Buffer.from("[{}]"),
});
await page
  .getByRole("status")
  .filter({ hasText: /Invalid catalog/ })
  .waitFor();
assert.equal(await page.locator(".manage-row").count(), initialSize + 1);
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
assert.equal(
  await page.locator(".flavor").count(),
  defaultCatalog.filter((f) => !f.demo && f.locations.includes("canal")).length,
);
await page.getByLabel("Catalog entries").selectOption("demo");
assert.equal(await page.locator(".flavor").count(), 3);
await page.getByLabel("Search flavor names", { exact: true }).fill("Coconut");
assert.equal(await page.locator(".flavor").count(), 1);
const cocoaButton = page.getByRole("button", {
  name: "View details for Coconut Cocoa",
  exact: true,
});
await cocoaButton.click();
const mobileDialog = page.getByRole("dialog", {
  name: "Coconut Cocoa",
  exact: true,
});
assert.match(
  await mobileDialog
    .getByRole("region", { name: "Store locations" })
    .innerText(),
  /Canal Park/,
);
assert.match(
  await mobileDialog
    .getByRole("region", { name: "Store locations" })
    .innerText(),
  /Lincoln Park/,
);
assert.ok(await mobileDialog.evaluate((d) => d.scrollWidth <= d.clientWidth));
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").count(), 0);
assert.ok(await cocoaButton.evaluate((el) => el === document.activeElement));
await cocoaButton.click();
await page.mouse.click(1, 1);
assert.equal(await page.getByRole("dialog").count(), 0);
await page.getByLabel("Search flavor names", { exact: true }).fill("");
assert.equal(await page.locator(".flavor").count(), 3);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: artifact("love-mobile.png"), fullPage: true });
await page.setViewportSize({ width: 1400, height: 1000 });
await page.screenshot({ path: artifact("love-desktop.png"), fullPage: true });

// The old v1 catalog and custom edits survive; adding new listings is explicit and repeatable.
const legacy = await browser.newPage({ viewport: { width: 390, height: 844 } });
await legacy.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:5173");
const legacyCatalog = defaultCatalog
  .slice(0, 4)
  .map(({ nutrition, ingredientInfo, ingredientsComplete, ...f }, i) => ({
    ...f,
    name: i === 0 ? "Legacy Custom Cocoa" : f.name,
  }));
await legacy.evaluate(
  (data) =>
    localStorage.setItem("love-creamery-catalog-v1", JSON.stringify(data)),
  legacyCatalog,
);
await legacy.reload();
await legacy
  .getByRole("button", { name: "Manage catalog", exact: true })
  .click();
assert.equal(await legacy.locator(".manage-row").count(), 4);
await legacy
  .getByRole("button", { name: "Add latest shop listings", exact: true })
  .click();
assert.equal(await legacy.locator(".manage-row").count(), initialSize);
assert.equal(
  await legacy.getByText("Legacy Custom Cocoa", { exact: true }).count(),
  1,
);
await legacy
  .getByRole("button", { name: "Add latest shop listings", exact: true })
  .click();
assert.equal(await legacy.locator(".manage-row").count(), initialSize);
await legacy
  .locator(".manage-row")
  .filter({ hasText: "Legacy Custom Cocoa" })
  .getByRole("button", { name: "Edit", exact: true })
  .click();
assert.equal(
  await legacy.getByLabel("Nutrition evidence", { exact: true }).inputValue(),
  "unknown",
);
assert.equal(
  await legacy.getByLabel("Calories (kcal)", { exact: true }).inputValue(),
  "",
);
assert.ok(
  await legacy.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ),
);
await legacy.close();
const broken = await browser.newPage();
await broken.route("**/flavors/lc-salted-caramel.jpg", (route) =>
  route.abort(),
);
await broken.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:5173");
await broken.getByRole("button", { name: /Canal Park/ }).click();
await broken.getByRole("button", { name: /Find My Flavors/ }).click();
await broken
  .getByLabel("Search flavor names", { exact: true })
  .fill("Salted Caramel");
const brokenCard = broken.locator(".flavor").filter({
  has: broken.getByRole("heading", { name: "Salted Caramel", exact: true }),
});
await brokenCard.locator(".flavor-art").scrollIntoViewIfNeeded();
await brokenCard
  .getByRole("img", { name: /official photo unavailable/ })
  .waitFor();
assert.equal(await brokenCard.locator(".flavor-photo").count(), 0);
await brokenCard
  .getByRole("button", { name: "View details for Salted Caramel", exact: true })
  .click();
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
  "Browser checks passed: filters, multiple-location union, compact cards, keyboard/mobile details and store locations, ingredient question, add/edit/archive/delete, refresh persistence, JSON roundtrip, invalid import, nutrition labels and editing, unknown dyes, legacy migration, all 45 official photos, missing/broken photo fallback, mobile overflow, no runtime errors.",
);
await browser.close();
