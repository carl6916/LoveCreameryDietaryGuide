import React from "react";
import type { Flavor } from "./logic";
import { evidenceLabels, nutrientFields, ingredientFields } from "./nutrition";
import { portionNutrition, defaultPortion, type Portion } from "./servings";
export function NutritionPanel({
  flavor: f,
  expanded = false,
  portion = defaultPortion,
}: {
  flavor: Flavor;
  expanded?: boolean;
  portion?: Portion;
}) {
  const n = portionNutrition(f.nutrition, portion);
  return (
    <section
      className="nutrition-panel"
      aria-label={`${f.name} nutrition and ingredients`}
    >
      <h4>Nutrition & ingredients</h4>
      <p className="serving">
        Per {n.servingSize} · {n.servingGrams} g ice cream
        {portion.container === "cone" ? " + one cone (included in totals)" : ""}
      </p>
      <div className="nutrition-highlights">
        {(["calories", "totalSugars", "protein"] as const).map((key) => {
          const field = nutrientFields.find((f) => f.key === key)!;
          return (
            <div key={key}>
              <strong>
                {n[key] === null ? "Unknown" : n[key]}
                {n[key] !== null && <small> {field.unit}</small>}
              </strong>
              <span>{field.label}</span>
            </div>
          );
        })}
      </div>
      <details open={expanded}>
        <summary>View all nutrition & ingredient details</summary>
        <table>
          <caption>Per serving above</caption>
          <tbody>
            {nutrientFields.map((field) => (
              <tr key={field.key}>
                <th scope="row">{field.label}</th>
                <td>
                  {n[field.key] === null
                    ? "Unknown"
                    : `${n[field.key]} ${field.unit}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4>General ingredient information</h4>
        <p>
          Ingredient list:{" "}
          {f.ingredientsComplete === "yes"
            ? "complete (as entered)"
            : f.ingredientsComplete === "no"
              ? "partial only — not a full recipe"
              : "completeness unknown"}
          . Unknown does not mean absent.
        </p>
        <dl className="ingredient-facts">
          {ingredientFields.map((field) => {
            const fact = f.ingredientInfo.fields[field.key];
            return (
              <React.Fragment key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  <span className={`evidence-tag ${fact.status}`}>
                    {evidenceLabels[fact.status]}
                  </span>
                  <br />
                  {fact.value}
                </dd>
              </React.Fragment>
            );
          })}
        </dl>
      </details>
    </section>
  );
}
