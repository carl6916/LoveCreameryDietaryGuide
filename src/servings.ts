import { nutrientFields, type Nutrition, type Nutrient } from "./nutrition";
import type { Flavor } from "./logic";

export const sizes = { small: 75, regular: 100, large: 150 } as const;
export type Portion = { size: keyof typeof sizes; container: "cup" | "cone" };
export const defaultPortion: Portion = { size: "regular", container: "cup" };
// Invented prototype cone values, not Love Creamery product information.
const cone: Record<Nutrient, number> = {
  calories: 50, totalFat: 1, saturatedFat: 0, transFat: 0,
  cholesterol: 0, sodium: 35, carbohydrates: 10, fiber: 0,
  totalSugars: 3, addedSugars: 3, protein: 1,
};
export function portionNutrition(n: Nutrition, portion: Portion): Nutrition {
  const grams = sizes[portion.size];
  const result = { ...n, servingGrams: grams, servingSize: `${portion.size} ${portion.container}` };
  for (const { key } of nutrientFields) {
    result[key] = n[key] === null || n.servingGrams === null
      ? null
      : Math.round((n[key]! * grams / n.servingGrams + (portion.container === "cone" ? cone[key] : 0)) * 10) / 10;
  }
  return result;
}
export function sortFlavors(flavors: Flavor[], field: "name" | Nutrient, descending: boolean, portion: Portion): Flavor[] {
  return [...flavors].sort((a, b) => {
    if (field === "name") return (descending ? -1 : 1) * a.name.localeCompare(b.name);
    const av = portionNutrition(a.nutrition, portion)[field];
    const bv = portionNutrition(b.nutrition, portion)[field];
    // Unknowns always follow numeric values, in either direction.
    if (av === null) return bv === null ? a.name.localeCompare(b.name) : 1;
    if (bv === null) return -1;
    return (descending ? -1 : 1) * (av - bv) || a.name.localeCompare(b.name);
  });
}
