import locations from "./locations.json";
import {
  validateNutrition,
  validateIngredientInfo,
  nutritionSummary,
  ingredientFields,
  evidenceLabels,
  type Nutrition,
  type IngredientInfo,
} from "./nutrition";
export const allergens = [
  "milk",
  "egg",
  "peanut",
  "tree nut",
  "soy",
  "sesame",
] as const;
export type Allergen = (typeof allergens)[number];
export type Status = "contains" | "absent" | "unknown";
export type Flavor = {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  color: string;
  vegan: "yes" | "no" | "unknown";
  glutenFree: "yes" | "no" | "unknown";
  allergens: Record<Allergen, Status>;
  locations: string[];
  availability: "available" | "unavailable" | "unknown";
  season: string;
  verified: string;
  source: string;
  demo: boolean;
  archived: boolean;
  nutrition: Nutrition;
  ingredientInfo: IngredientInfo;
  ingredientsComplete: "yes" | "no" | "unknown";
};
export type Need = "vegan" | "gluten-free" | Allergen;
export function matchesLocations(
  flavor: Pick<Flavor, "locations">,
  selectedLocations: readonly string[],
): boolean {
  return selectedLocations.some((id) => flavor.locations.includes(id));
}
export function classify(
  f: Flavor,
  needs: Need[],
): "Matches documented restrictions" | "Needs confirmation" | "Does not match" {
  const values = needs.map((n) =>
    n === "vegan"
      ? f.vegan
      : n === "gluten-free"
        ? f.glutenFree
        : f.allergens[n] === "contains"
          ? "no"
          : f.allergens[n] === "absent"
            ? "yes"
            : "unknown",
  );
  return values.includes("no")
    ? "Does not match"
    : values.includes("unknown")
      ? "Needs confirmation"
      : "Matches documented restrictions";
}
export function validateCatalog(value: unknown): Flavor[] {
  if (!Array.isArray(value) || value.length > 1000)
    throw Error("Expected an array of up to 1,000 flavors.");
  const ids = new Set();
  const normalized: Flavor[] = [];
  for (const f of value) {
    if (
      !f ||
      typeof f !== "object" ||
      [
        "id",
        "name",
        "description",
        "ingredients",
        "color",
        "season",
        "verified",
        "source",
      ].some((k) => typeof f[k] !== "string") ||
      !f.id.trim() ||
      !f.name.trim() ||
      ids.has(f.id) ||
      !/^#[0-9a-f]{6}$/i.test(f.color) ||
      !["yes", "no", "unknown"].includes(f.vegan) ||
      !["yes", "no", "unknown"].includes(f.glutenFree) ||
      !["available", "unavailable", "unknown"].includes(f.availability) ||
      typeof f.demo !== "boolean" ||
      typeof f.archived !== "boolean" ||
      !Array.isArray(f.locations) ||
      f.locations.some(
        (l: unknown) => !locations.some((known) => known.id === l),
      ) ||
      !f.allergens ||
      allergens.some(
        (a) => !["contains", "absent", "unknown"].includes(f.allergens[a]),
      ) ||
      (!f.demo && (!f.source.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(f.verified)))
    )
      throw Error(
        "Invalid catalog: check fields, unique IDs, source, verification date, and explicit allergen values.",
      );
    if (
      f.ingredientsComplete !== undefined &&
      !["yes", "no", "unknown"].includes(f.ingredientsComplete)
    )
      throw Error("Invalid ingredient-list completeness.");
    ids.add(f.id);
    normalized.push({
      ...f,
      ingredientsComplete: f.ingredientsComplete ?? "unknown",
      nutrition: validateNutrition(f.nutrition),
      ingredientInfo: validateIngredientInfo(f.ingredientInfo),
    });
  }
  return normalized;
}
export function answer(
  question: string,
  catalog: Flavor[],
  location: string | readonly string[] = locations.map((l) => l.id),
  selected?: Flavor,
  { showNotices = true }: { showNotices?: boolean } = {},
): string {
  const q = question.toLowerCase();
  const needs: Need[] = [];
  if (/vegan|plant.based/.test(q)) needs.push("vegan");
  if (/gluten|celiac|coeliac|wheat.free/.test(q)) needs.push("gluten-free");
  const aliases: Record<Allergen, RegExp> = {
    milk: /milk|dairy|lactose/,
    egg: /egg/,
    peanut: /peanut|groundnut/,
    "tree nut": /tree.?nut|almond|cashew|coconut|walnut|pecan/,
    soy: /soy|soya/,
    sesame: /sesame|tahini/,
  };
  for (const a of allergens) if (aliases[a].test(q)) needs.push(a);
  const mentionedLocations = [
    ...(/canal/.test(q) ? ["canal"] : []),
    ...(/lincoln/.test(q) ? ["lincoln"] : []),
    ...(/billings|superior/.test(q) ? ["billings"] : []),
  ];
  if (/\bduluth\b/.test(q) && !/canal|lincoln/.test(q))
    mentionedLocations.push("canal", "lincoln");
  const fallback = typeof location === "string" ? [location] : location;
  const loc = mentionedLocations.length
    ? mentionedLocations
    : fallback.filter(Boolean).length
      ? fallback
      : locations.map((l) => l.id);
  const named =
    catalog
      .filter((f) => q.includes(f.name.toLowerCase()))
      .sort((a, b) => b.name.length - a.name.length)[0] ||
    (/this flavor|this flavour/.test(q) ? selected : undefined);
  if (/this flavou?r/.test(q) && !named)
    return "Select “Ask about this flavor” on a card first, or type its full name.";
  const candidates = catalog.filter(
    (f) =>
      !f.archived &&
      matchesLocations(f, loc) &&
      (!named || f.id === named.id) &&
      // Direct flavor questions still explain conflicts; recommendations omit them.
      (Boolean(named) || classify(f, needs) !== "Does not match") &&
      (!/chocolate|cocoa/.test(q) ||
        /chocolate|cocoa/i.test(f.name + " " + f.ingredients)),
  );
  if (
    /nutrition|calorie|kcal|sugar|protein|carb|fiber|fibre|sodium|cholesterol|fat|\bsalt\b|dye|color|colour|red\s*40|yellow\s*[56]|blue\s*[12]|fd&c|sweetener|caffeine|alcohol|preservative|artificial|base|ingredient/.test(
      q,
    )
  ) {
    const requestedFacts = ingredientFields.filter((f) =>
      ({
        base: /base|milk type/,
        sweeteners: /sweetener|sugar/,
        dyes: /dye|color|colour|red\s*40|yellow\s*[56]|blue\s*[12]|fd&c/,
        artificialFlavors: /artificial|flavou?ring/,
        preservatives: /preservative/,
        sugarAlcohols: /sugar.alcohol|sweetener/,
        caffeine: /caffeine|coffee/,
        alcohol: /alcohol/,
      })[f.key].test(q),
    );
    const wantsNutrition =
      /nutrition|calorie|kcal|sugar|protein|carb|fiber|fibre|sodium|cholesterol|fat|\bsalt\b/.test(
        q,
      );
    return (
      (candidates.length
        ? candidates
            .map(
              (f) =>
                `${f.name}${f.demo ? " [DEMONSTRATION FLAVOR]" : " [OFFICIAL MENU LISTING]"}${needs.length ? `\nDietary check: ${classify(f, needs)}` : ""}\n${wantsNutrition ? nutritionSummary(f.nutrition, showNotices) : ""}${requestedFacts.map((field) => `\n${field.label}: ${f.ingredientInfo.fields[field.key].value} [${evidenceLabels[f.ingredientInfo.fields[field.key].status]}]`).join("")}${showNotices && requestedFacts.length && f.ingredientInfo.source ? `\nIngredient source: ${f.ingredientInfo.source}; checked ${f.ingredientInfo.verified || "Unknown"}` : ""}${/ingredient/.test(q) ? `\nIngredient description (${f.ingredientsComplete === "yes" ? "complete list" : "partial or unconfirmed list"}): ${f.ingredients}` : ""}`,
            )
            .join("\n\n")
        : "No matching catalog entries for that flavor and location.") +
      (showNotices
        ? "\n\nFictional numbers are invented demonstrations, not estimates, nutrition labels, or guidance for medical diets. Missing dye and ingredient information stays unknown. Confirm real nutrition and preparation practices directly with Love Creamery."
        : "")
    );
  }
  if (!needs.length && !named && !/flavor|flavour|available|ingredient/.test(q))
    return "I can look up documented dietary labels, ingredients, allergens, and locations. Try “Which flavors are vegan and gluten-free?” I cannot verify missing information; contact Love Creamery directly.";
  const lines = candidates.map(
    (f) =>
      `${f.name}${f.demo ? " [DEMONSTRATION]" : ""}: ${needs.length ? classify(f, needs) : f.ingredients}. ${needs.map((n) => (n === "vegan" ? `Vegan: ${f.vegan}` : n === "gluten-free" ? `Gluten-free: ${f.glutenFree}` : `${n}: ${f.allergens[n] === "absent" ? (f.demo ? "not listed as an ingredient (documented in this demo recipe)" : "not listed as an ingredient (verified)") : f.allergens[n]}`)).join("; ")} Availability: ${f.availability}.`,
  );
  return (
    (lines.length
      ? lines.join("\n\n")
      : "No matching catalog entries for that flavor and location.") +
    (showNotices
      ? "\n\nDemo data does not establish real products or stock. Unknown information needs confirmation. Recipe absence does not guarantee protection from cross-contact. Confirm ingredients and preparation practices directly with Love Creamery."
      : "")
  );
}
