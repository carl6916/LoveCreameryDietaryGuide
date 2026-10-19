import { test } from "node:test";
import assert from "node:assert/strict";
import data from "./catalog.json";
import { answer, classify, validateCatalog, matchesLocations } from "./logic";
const catalog = validateCatalog(data);
test("vegan and gluten-free requirements are combined", () => {
  assert.equal(
    classify(catalog[0], ["vegan", "gluten-free"]),
    "Matches documented restrictions",
  );
  assert.equal(
    classify(catalog[2], ["vegan", "gluten-free"]),
    "Does not match",
  );
});
test("vegan does not imply milk allergy match", () =>
  assert.equal(classify(catalog[0], ["vegan", "milk"]), "Needs confirmation"));
test("peanut allergy distinguishes absent, unknown, and contains", () => {
  assert.equal(
    classify(catalog[1], ["peanut"]),
    "Matches documented restrictions",
  );
  assert.equal(classify(catalog[2], ["peanut"]), "Needs confirmation");
  assert.equal(classify(catalog[3], ["peanut"]), "Does not match");
});
test("conflicts take precedence over unknowns", () =>
  assert.equal(classify(catalog[3], ["vegan", "soy"]), "Does not match"));
test("assistant supports locations and multiple needs", () => {
  const text = answer(
    "vegan and gluten-free in Billings Park",
    catalog,
    "canal",
  );
  assert.match(text, /Summer Berry/);
  assert.doesNotMatch(text, /Coconut Cocoa/);
  assert.match(text, /Does not match/);
});
test("assistant reports specific ingredient and uncertainty", () => {
  assert.match(
    answer("Does Vanilla Bean contain eggs?", catalog, "canal"),
    /egg: contains/,
  );
  assert.match(
    answer("Does Coconut Cocoa contain milk?", catalog, "canal"),
    /milk: unknown/,
  );
  assert.match(
    answer("Does this flavor contain eggs?", catalog, "canal"),
    /Select/,
  );
});
test("archived flavors stay out of assistant results", () =>
  assert.doesNotMatch(
    answer(
      "vegan flavors",
      catalog.map((f) => ({ ...f, archived: true })),
      "canal",
    ),
    /Summer Berry/,
  ));
test("import roundtrip and unsafe malformed inputs", () => {
  assert.deepEqual(
    validateCatalog(JSON.parse(JSON.stringify(catalog))),
    catalog,
  );
  for (const value of [
    {},
    [{}],
    [catalog[0], catalog[0]],
    [{ ...catalog[0], allergens: {} }],
    [{ ...catalog[0], demo: false, verified: "" }],
  ])
    assert.throws(() => validateCatalog(value));
});

test("official menu listings retain unknown allergy and additive information", () => {
  const caramel = catalog.find((f) => f.id === "lc-salted-caramel")!;
  assert.equal(caramel.demo, false);
  assert.equal(caramel.verified, "2026-10-19");
  assert.equal(caramel.allergens.milk, "contains");
  assert.equal(caramel.allergens.peanut, "unknown");
  assert.equal(caramel.ingredientInfo.fields.dyes.status, "unknown");
  assert.equal(caramel.ingredientsComplete, "no");
  assert.equal(caramel.nutrition.status, "fictional");
  assert.equal(catalog.filter((f) => !f.demo).length, 46);
});
test("nutrition assistant labels invented numbers and unknown dyes", () => {
  const text = answer(
    "How many calories and sugars in Salted Caramel?",
    catalog,
    "canal",
  );
  assert.match(text, /FICTIONAL NUTRITION/);
  assert.match(text, /Calories: \d+ kcal/);
  assert.match(text, /Total sugars: \d+ g/);
  assert.match(text, /Serving:/);
  assert.match(text, /not estimates/);
  assert.match(
    answer("Does Salted Caramel have dyes?", catalog, "canal"),
    /Dyes \/ added colors: Unknown \[Unknown\]/,
  );
});
test("assistant prefers the longest exact flavor name", () => {
  const text = answer(
    "How much protein in Vegan Salted Caramel?",
    catalog,
    "lincoln",
  );
  assert.match(text, /^Vegan Salted Caramel \[OFFICIAL MENU LISTING\]/);
  assert.doesNotMatch(text, /\n\nSalted Caramel \[/);
});
test("legacy imports migrate to unknown nutrition without changing local edits", () => {
  const { nutrition, ingredientInfo, ingredientsComplete, ...old } = catalog[0];
  const original = { ...old, name: "My custom flavor" };
  const migrated = validateCatalog([original])[0];
  assert.equal(migrated.name, "My custom flavor");
  assert.equal(migrated.nutrition.calories, null);
  assert.equal(migrated.nutrition.status, "unknown");
  assert.equal(migrated.ingredientInfo.fields.dyes.status, "unknown");
  assert.equal(migrated.ingredientsComplete, "unknown");
  assert.equal("nutrition" in original, false);
});
test("zero is preserved and distinct from unknown nutrition", () => {
  const f = structuredClone(catalog[1]);
  f.nutrition.protein = 0;
  f.nutrition.sodium = null;
  const result = validateCatalog([f])[0];
  assert.equal(result.nutrition.protein, 0);
  assert.equal(result.nutrition.sodium, null);
});
test("nutrition rejects invalid values, inconsistent totals and missing evidence", () => {
  const base = catalog[0];
  for (const n of [
    { ...base.nutrition, calories: -1 },
    { ...base.nutrition, calories: "250" },
    { ...base.nutrition, calories: NaN },
    { ...base.nutrition, calories: Infinity },
    { ...base.nutrition, servingGrams: 0 },
    { ...base.nutrition, status: "unknown" },
    { ...base.nutrition, addedSugars: 99 },
    { ...base.nutrition, totalSugars: 99 },
    { ...base.nutrition, saturatedFat: 99 },
    { ...base.nutrition, status: "documented", source: "", verified: "" },
    {
      ...base.nutrition,
      status: "documented",
      source: "label",
      verified: "2026-02-30",
    },
    { ...base.nutrition, servingSize: "Unknown" },
  ])
    assert.throws(() => validateCatalog([{ ...base, nutrition: n }]));
  const documented = {
    ...base.nutrition,
    status: "documented",
    source: "Example label supplied by editor",
    verified: "2026-10-19",
  };
  assert.equal(
    validateCatalog([{ ...base, nutrition: documented }])[0].nutrition.status,
    "documented",
  );
});
test("ingredient facts need evidence and survive JSON export/import", () => {
  const f = structuredClone(catalog[0]);
  f.ingredientInfo.fields.dyes = {
    status: "documented",
    value: "Published color ingredient",
  };
  assert.throws(() => validateCatalog([f]));
  f.ingredientInfo.source = "Example ingredient label";
  f.ingredientInfo.verified = "2026-10-19";
  const roundtrip = validateCatalog(JSON.parse(JSON.stringify([f])))[0];
  assert.deepEqual(roundtrip.ingredientInfo, f.ingredientInfo);
  assert.deepEqual(roundtrip.nutrition, f.nutrition);
  f.ingredientInfo.fields.dyes = { status: "unknown", value: "No dyes" };
  assert.throws(() => validateCatalog([f]));
});

test("official photo mapping requires both identity and name, and excludes demos", async () => {
  const { getFlavorPhoto } = await import("./flavorPhotos");
  const caramel = catalog.find((f) => f.id === "lc-salted-caramel")!;
  assert.equal(getFlavorPhoto(caramel)?.path, "flavors/lc-salted-caramel.jpg");
  assert.equal(getFlavorPhoto({ ...caramel, demo: true }), undefined);
  assert.equal(
    getFlavorPhoto({ ...caramel, name: "My custom recipe" }),
    undefined,
  );
  assert.equal(getFlavorPhoto({ ...caramel, id: "constructor" }), undefined);
  assert.equal(
    getFlavorPhoto(catalog.find((f) => f.id === "lc-apple-cajeta")!),
    undefined,
  );
});
test("all photo metadata matches official catalog records and bundled files", async () => {
  const { flavorPhotos } = await import("./flavorPhotos");
  const { statSync } = await import("node:fs");
  assert.equal(Object.keys(flavorPhotos).length, 45);
  for (const [id, photo] of Object.entries(flavorPhotos)) {
    const flavor = catalog.find((f) => f.id === id)!;
    assert.ok(flavor);
    assert.equal(flavor.demo, false);
    assert.equal(flavor.name, photo.name);
    assert.match(photo.path, /^flavors\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);
    assert.match(
      photo.source,
      /^https:\/\/(www\.)?lovecreamery\.com\/wp-content\/uploads\//,
    );
    assert.ok(photo.alt.trim());
    assert.ok(
      statSync(new URL("../public/" + photo.path, import.meta.url)).size > 0,
    );
  }
});

test("location filtering combines selected shops without duplicate flavors", () => {
  assert.equal(matchesLocations(catalog[0], []), false);
  assert.equal(matchesLocations(catalog[0], ["billings"]), false);
  assert.equal(matchesLocations(catalog[0], ["billings", "lincoln"]), true);
  const result = catalog
    .slice(0, 4)
    .filter((f) => matchesLocations(f, ["canal", "lincoln"]));
  assert.equal(result.length, 4);
  assert.equal(result.filter((f) => f.id === "vanilla").length, 1);
});
test("assistant shares the selected location union and honors explicit shops", () => {
  const text = answer("What flavors are vegan?", catalog.slice(0, 4), [
    "canal",
    "lincoln",
  ]);
  for (const name of [
    "Coconut Cocoa",
    "Summer Berry Sorbet",
    "Vanilla Bean",
    "Peanut Cookie Crunch",
  ])
    assert.ok(text.includes(name));
  assert.equal((text.match(/Vanilla Bean/g) || []).length, 1);
  const explicit = answer(
    "vegan flavors in Billings Park",
    catalog.slice(0, 4),
    ["canal", "lincoln"],
  );
  assert.doesNotMatch(explicit, /Coconut Cocoa/);
  const mentioned = answer(
    "vegan flavors in Canal Park and Lincoln Park",
    catalog.slice(0, 4),
    ["billings"],
  );
  assert.match(mentioned, /Coconut Cocoa/);
  assert.match(mentioned, /Peanut Cookie Crunch/);
  assert.match(answer("vegan flavors", catalog, []), /No matching/);
});
