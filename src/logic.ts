import locations from "./locations.json";
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
};
export type Need = "vegan" | "gluten-free" | Allergen;
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
    ids.add(f.id);
  }
  return value as Flavor[];
}
export function answer(
  question: string,
  catalog: Flavor[],
  location: string,
  selected?: Flavor,
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
  const loc = /canal/.test(q)
    ? "canal"
    : /lincoln/.test(q)
      ? "lincoln"
      : /billings|superior/.test(q)
        ? "billings"
        : location;
  const named =
    catalog.find((f) => q.includes(f.name.toLowerCase())) ||
    (/this flavor|this flavour/.test(q) ? selected : undefined);
  if (/this flavou?r/.test(q) && !named)
    return "Select “Ask about this flavor” on a card first, or type its full name.";
  const candidates = catalog.filter(
    (f) =>
      !f.archived &&
      f.locations.includes(loc) &&
      (!named || f.id === named.id) &&
      (!/chocolate|cocoa/.test(q) ||
        /chocolate|cocoa/i.test(f.name + " " + f.ingredients)),
  );
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
    "\n\nDemo data does not establish real products or stock. Unknown information needs confirmation. Recipe absence does not guarantee protection from cross-contact. Confirm ingredients and preparation practices directly with Love Creamery."
  );
}
