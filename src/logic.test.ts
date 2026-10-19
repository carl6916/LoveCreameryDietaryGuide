import { test } from "node:test";
import assert from "node:assert/strict";
import data from "./catalog.json";
import { answer, classify, validateCatalog } from "./logic";
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
