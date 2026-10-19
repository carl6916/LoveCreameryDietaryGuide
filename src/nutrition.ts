export type Evidence = "documented" | "fictional" | "unknown";
export const evidenceLabels: Record<Evidence, string> = {
  documented: "Source documented",
  fictional: "Fictional example",
  unknown: "Unknown",
};
export const nutrientFields = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "totalFat", label: "Total fat", unit: "g" },
  { key: "saturatedFat", label: "Saturated fat", unit: "g" },
  { key: "transFat", label: "Trans fat", unit: "g" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "carbohydrates", label: "Total carbohydrates", unit: "g" },
  { key: "fiber", label: "Dietary fiber", unit: "g" },
  { key: "totalSugars", label: "Total sugars", unit: "g" },
  { key: "addedSugars", label: "Added sugars", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
] as const;
export type Nutrient = (typeof nutrientFields)[number]["key"];
export type Nutrition = Record<Nutrient, number | null> & {
  status: Evidence;
  servingSize: string;
  servingGrams: number | null;
  source: string;
  verified: string;
};
export const ingredientFields = [
  { key: "base", label: "Base / milk type" },
  { key: "sweeteners", label: "Sweeteners" },
  { key: "dyes", label: "Dyes / added colors" },
  { key: "artificialFlavors", label: "Artificial flavors" },
  { key: "preservatives", label: "Preservatives" },
  { key: "sugarAlcohols", label: "Sugar alcohols" },
  { key: "caffeine", label: "Caffeine" },
  { key: "alcohol", label: "Alcohol" },
] as const;
export type IngredientField = (typeof ingredientFields)[number]["key"];
export type IngredientInfo = {
  source: string;
  verified: string;
  fields: Record<IngredientField, { status: Evidence; value: string }>;
};
export function emptyNutrition(): Nutrition {
  return {
    status: "unknown",
    servingSize: "Unknown",
    servingGrams: null,
    source: "",
    verified: "",
    ...Object.fromEntries(nutrientFields.map((f) => [f.key, null])),
  } as Nutrition;
}
export function emptyIngredientInfo(): IngredientInfo {
  return {
    source: "",
    verified: "",
    fields: Object.fromEntries(
      ingredientFields.map((f) => [
        f.key,
        { status: "unknown", value: "Unknown" },
      ]),
    ),
  } as IngredientInfo;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function evidence(value: unknown): value is Evidence {
  return value === "documented" || value === "fictional" || value === "unknown";
}
export function validateNutrition(value: unknown): Nutrition {
  if (value === undefined) return emptyNutrition(); // Migrate older browser catalogs without inventing values.
  if (
    !object(value) ||
    !evidence(value.status) ||
    ["servingSize", "source", "verified"].some(
      (k) => typeof value[k] !== "string",
    ) ||
    !String(value.servingSize).trim()
  )
    throw Error("Invalid nutrition metadata.");
  for (const k of ["servingGrams", ...nutrientFields.map((f) => f.key)]) {
    const v = value[k];
    if (
      v !== null &&
      (typeof v !== "number" ||
        !Number.isFinite(v) ||
        v < 0 ||
        (k === "servingGrams" && v === 0))
    )
      throw Error(
        `Invalid nutrition value: ${k}. Use a nonnegative number or null for unknown.`,
      );
  }
  const n = value as Nutrition;
  if (
    n.status === "unknown" &&
    ["servingGrams", ...nutrientFields.map((f) => f.key)].some(
      (k) => value[k] !== null,
    )
  )
    throw Error(
      "Unknown nutrition cannot include numeric claims. Choose fictional or documented.",
    );
  if (n.status === "documented" && (!n.source.trim() || !validDate(n.verified)))
    throw Error(
      "Documented nutrition needs a source and a valid verification date.",
    );
  if (
    n.status !== "unknown" &&
    nutrientFields.some((f) => n[f.key] !== null) &&
    n.servingSize.trim().toLowerCase() === "unknown"
  )
    throw Error("Nutrition numbers need a serving size.");
  for (const [part, total] of [
    ["addedSugars", "totalSugars"],
    ["totalSugars", "carbohydrates"],
    ["fiber", "carbohydrates"],
    ["saturatedFat", "totalFat"],
    ["transFat", "totalFat"],
  ] as const)
    if (n[part] !== null && n[total] !== null && n[part]! > n[total]!)
      throw Error(`${part} cannot exceed ${total}.`);
  return structuredClone(n);
}
export function validateIngredientInfo(value: unknown): IngredientInfo {
  if (value === undefined) return emptyIngredientInfo();
  if (
    !object(value) ||
    typeof value.source !== "string" ||
    typeof value.verified !== "string" ||
    !object(value.fields)
  )
    throw Error("Invalid ingredient information.");
  for (const { key } of ingredientFields) {
    const fact = value.fields[key];
    if (
      !object(fact) ||
      !evidence(fact.status) ||
      typeof fact.value !== "string" ||
      !fact.value.trim() ||
      (fact.status === "unknown" && fact.value !== "Unknown")
    )
      throw Error(`Invalid ingredient field: ${key}.`);
    if (
      fact.status === "documented" &&
      (!value.source.trim() || !validDate(value.verified))
    )
      throw Error(
        "Documented ingredient facts need a source and valid verification date.",
      );
  }
  return structuredClone(value) as IngredientInfo;
}
export function nutritionSummary(n: Nutrition, showNotice = true): string {
  const heading = showNotice
    ? n.status === "fictional"
      ? "FICTIONAL NUTRITION — invented, not measured or calculated for Love Creamery"
      : n.status === "documented"
        ? "Source-documented nutrition"
        : "Nutrition unknown — not published in this catalog"
    : "Nutrition per stored serving";
  const serving =
    !showNotice && n.status === "fictional" ? "example serving" : n.servingSize;
  const sourceVisible = showNotice || n.status === "documented";
  return `${heading}. Serving: ${serving}${n.servingGrams !== null ? ` (${n.servingGrams} g)` : ""}. ${nutrientFields.map((f) => `${f.label}: ${n[f.key] === null ? "Unknown" : `${n[f.key]} ${f.unit}`}`).join("; ")}.${sourceVisible && n.source ? ` Source: ${n.source}.` : ""}${sourceVisible && n.verified ? ` Checked: ${n.verified}.` : ""}`;
}
