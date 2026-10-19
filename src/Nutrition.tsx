import React from "react";
import type { Flavor } from "./logic";
import {
  emptyNutrition,
  evidenceLabels,
  nutrientFields,
  ingredientFields,
  type Evidence,
} from "./nutrition";
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
      <p className={`evidence-note ${n.status}`}>
        {n.status === "fictional" ? (
          <>
            <strong>FICTIONAL NUTRITION</strong> — made-up values and serving
            size, not Love Creamery facts or calculated estimates. Do not use
            for medical diets.
          </>
        ) : n.status === "unknown" ? (
          "Nutrition unknown — no values are documented in this catalog."
        ) : (
          <>
            Source-documented nutrition. Check the source, serving size, and
            date below.
          </>
        )}
      </p>
      <p className="serving">
        Per {n.servingSize}
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
          <caption>{evidenceLabels[n.status]} · per serving above</caption>
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
        <p>
          <strong>Nutrition source:</strong> {n.source || "Not provided"}
          <br />
          <strong>Nutrition checked:</strong>{" "}
          {n.status === "fictional"
            ? "Not verified — invented data"
            : n.verified || "Unknown"}
        </p>
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
export function NutritionEditor({
  flavor: f,
  onChange,
}: {
  flavor: Flavor;
  onChange: (value: Flavor) => void;
}) {
  const n = f.nutrition;
  const info = f.ingredientInfo;
  const hasDocumentedIngredients = ingredientFields.some(
    (k) => info.fields[k.key].status === "documented",
  );
  return (
    <>
      <fieldset className="nutrition-editor">
        <legend>Nutrition per serving</legend>
        <p>
          Use null/blank for unknown values, never zero as a placeholder. Every
          numeric value in this block shares the selected evidence status. Real
          numbers require a source and date.
        </p>
        <label>
          Nutrition evidence
          <select
            aria-label="Nutrition evidence"
            value={n.status}
            onChange={(e) =>
              onChange({
                ...f,
                nutrition:
                  e.target.value === "unknown"
                    ? emptyNutrition()
                    : { ...n, status: e.target.value as Evidence },
              })
            }
          >
            {Object.entries(evidenceLabels).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Serving description
          <input
            value={n.servingSize}
            onChange={(e) =>
              onChange({
                ...f,
                nutrition: { ...n, servingSize: e.target.value },
              })
            }
            required
          />
        </label>
        <label>
          Serving weight (g)
          <input
            type="number"
            min="0.001"
            step="any"
            value={n.servingGrams ?? ""}
            disabled={n.status === "unknown"}
            onChange={(e) =>
              onChange({
                ...f,
                nutrition: {
                  ...n,
                  servingGrams:
                    e.target.value === "" ? null : Number(e.target.value),
                },
              })
            }
          />
        </label>
        <div className="nutrient-inputs">
          {nutrientFields.map((field) => (
            <label key={field.key}>
              {field.label} ({field.unit})
              <input
                type="number"
                min="0"
                step="any"
                disabled={n.status === "unknown"}
                value={n[field.key] ?? ""}
                onChange={(e) =>
                  onChange({
                    ...f,
                    nutrition: {
                      ...n,
                      [field.key]:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
        <label>
          Nutrition source
          <input
            value={n.source}
            required={n.status === "documented"}
            onChange={(e) =>
              onChange({ ...f, nutrition: { ...n, source: e.target.value } })
            }
          />
        </label>
        <label>
          Nutrition verification date
          <input
            type="date"
            value={n.verified}
            required={n.status === "documented"}
            onChange={(e) =>
              onChange({ ...f, nutrition: { ...n, verified: e.target.value } })
            }
          />
        </label>
      </fieldset>
      <fieldset className="nutrition-editor">
        <legend>General ingredient information</legend>
        <label>
          Ingredient list completeness
          <select
            value={f.ingredientsComplete}
            onChange={(e) =>
              onChange({
                ...f,
                ingredientsComplete: e.target
                  .value as Flavor["ingredientsComplete"],
              })
            }
          >
            <option value="unknown">Unknown</option>
            <option value="no">Partial ingredient description only</option>
            <option value="yes">Complete ingredient list</option>
          </select>
        </label>
        <p>
          Each fact has its own evidence status. Do not infer dye-free,
          caffeine-free, or allergen-free claims from a missing label.
        </p>
        {ingredientFields.map((field) => (
          <div className="ingredient-edit" key={field.key}>
            <label>
              {field.label} evidence
              <select
                aria-label={`${field.label} evidence`}
                value={info.fields[field.key].status}
                onChange={(e) =>
                  onChange({
                    ...f,
                    ingredientInfo: {
                      ...info,
                      fields: {
                        ...info.fields,
                        [field.key]: {
                          status: e.target.value as Evidence,
                          value:
                            e.target.value === "unknown"
                              ? "Unknown"
                              : info.fields[field.key].value === "Unknown"
                                ? ""
                                : info.fields[field.key].value,
                        },
                      },
                    },
                  })
                }
              >
                {Object.entries(evidenceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {field.label}
              <input
                required
                disabled={info.fields[field.key].status === "unknown"}
                value={info.fields[field.key].value}
                onChange={(e) =>
                  onChange({
                    ...f,
                    ingredientInfo: {
                      ...info,
                      fields: {
                        ...info.fields,
                        [field.key]: {
                          ...info.fields[field.key],
                          value: e.target.value,
                        },
                      },
                    },
                  })
                }
              />
            </label>
          </div>
        ))}
        <label>
          Ingredient facts source
          <input
            value={info.source}
            required={hasDocumentedIngredients}
            onChange={(e) =>
              onChange({
                ...f,
                ingredientInfo: { ...info, source: e.target.value },
              })
            }
          />
        </label>
        <label>
          Ingredient facts verification date
          <input
            type="date"
            value={info.verified}
            required={hasDocumentedIngredients}
            onChange={(e) =>
              onChange({
                ...f,
                ingredientInfo: { ...info, verified: e.target.value },
              })
            }
          />
        </label>
      </fieldset>
    </>
  );
}
