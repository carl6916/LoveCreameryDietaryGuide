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
assert.match(
  await caramel.locator(".nutrition-panel").innerText(),
  /FICTIONAL NUTRITION/,
);
await caramel
  .getByText("View all nutrition & ingredient details", { exact: true })
  .click();
assert.match(await caramel.locator("table").innerText(), /Added sugars/);
assert.match(
  await caramel
    .locator('.ingredient-facts dt:has-text("Dyes / added colors") + dd')
    .innerText(),
  /Unknown/,
);
await page
  .getByLabel("Ask the flavor guide")
  .fill("How many calories and sugars in Salted Caramel?");
await page.getByRole("button", { name: "Ask →", exact: true }).click();
assert.match(await page.locator(".reply").innerText(), /FICTIONAL NUTRITION/);
await page.getByLabel("Catalog entries").selectOption("demo");
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
await page.getByLabel("Search flavor names", { exact: true }).fill("");
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
assert.deepEqual(errors, []);
console.log(
  "Browser checks passed: filters, location switching, ingredient question, add/edit/archive/delete, refresh persistence, JSON roundtrip, invalid import, nutrition labels and editing, unknown dyes, legacy migration, mobile overflow, no runtime errors.",
);
await browser.close();
