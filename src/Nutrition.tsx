import React from "react";
import type { Flavor } from "./logic";
import { evidenceLabels, nutrientFields, ingredientFields } from "./nutrition";
export function NutritionPanel({
  flavor: f,
  expanded = false,
}: {
  flavor: Flavor;
  expanded?: boolean;
}) {
  const n = f.nutrition;
  return (
    <section
      className="nutrition-panel"
      aria-label={`${f.name} nutrition and ingredients`}
    >
      <h4>Nutrition & ingredients</h4>
      <p className="serving">
        Per {n.status === "fictional" ? "example serving" : n.servingSize}
        {n.servingGrams !== null ? ` · ${n.servingGrams} g` : ""}
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
        {n.status === "documented" && (
          <p>
            <strong>Nutrition source:</strong> {n.source}
            <br />
            <strong>Nutrition checked:</strong> {n.verified}
          </p>
        )}
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
        <p>
          <strong>Ingredient source:</strong>{" "}
          {f.ingredientInfo.source ||
            "Not provided; fictional or unknown fields are not verified"}
          <br />
          <strong>Ingredients checked:</strong>{" "}
          {f.ingredientInfo.verified || "Unknown"}
        </p>
      </details>
    </section>
  );
}
