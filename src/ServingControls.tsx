import { sizes, type Portion } from "./servings";
export function ServingControls({ portion, onChange }: { portion: Portion; onChange: (portion: Portion) => void }) {
  return <fieldset className="serving-controls">
    <legend>Choose your serving</legend>
    <div className="serving-options">
      <label>Size<select aria-label="Size" value={portion.size} onChange={e => onChange({ ...portion, size: e.target.value as Portion["size"] })}>
        {Object.entries(sizes).map(([size, grams]) => <option key={size} value={size}>{size[0].toUpperCase() + size.slice(1)} · {grams} g ice cream</option>)}
      </select></label>
      <label>Cup or cone<select aria-label="Cup or cone" value={portion.container} onChange={e => onChange({ ...portion, container: e.target.value as Portion["container"] })}>
        <option value="cup">Cup</option><option value="cone">Cone</option>
      </select></label>
    </div>
    <p>Example portions, not shop sizes. Nutrition scales by ice cream weight{portion.container === "cone" ? " and includes one example cone (+50 kcal). Cone ingredients and allergens need confirmation" : "; cup adds no nutrients"}. No toppings included.</p>
  </fieldset>;
}
