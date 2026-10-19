import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import initial from "./catalog.json";
import locations from "./locations.json";
import brand from "./brand.json";
import research from "./research.json";
import { emptyNutrition, emptyIngredientInfo } from "./nutrition";
import { NutritionEditor } from "./Nutrition";
import { FlavorDetails } from "./FlavorDetails";
import { FlavorImage } from "./FlavorImage";
import {
  allergens,
  answer,
  classify,
  matchesLocations,
  validateCatalog,
  type Flavor,
  type Need,
} from "./logic";
import "./style.css";
const key = "love-creamery-catalog-v1";
let loadWarning = "";
function load() {
  try {
    const saved = localStorage.getItem(key);
    const parsed = validateCatalog(saved ? JSON.parse(saved) : initial);
    if (saved && !parsed.some((f) => !f.demo))
      loadWarning =
        "Your saved catalog is preserved. Manage catalog → Add latest shop listings adds researched flavors without replacing your edits. Older nutrition fields start as unknown.";
    return parsed;
  } catch {
    loadWarning =
      "Saved catalog could not be loaded. Showing demonstration defaults; export or repair your browser data before saving.";
    return validateCatalog(initial);
  }
}
const labels: Record<string, string> = {
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  milk: "Dairy / milk",
  egg: "Egg",
  peanut: "Peanut",
  "tree nut": "Tree nut",
  soy: "Soy",
  sesame: "Sesame",
};
const statusLabel = {
  contains: "Contains",
  absent: "Not listed as an ingredient (verified)",
  unknown: "Unknown",
};
function BrandMark() {
  return (
    <>
      {brand.logoImage ? (
        <img
          className="official-logo"
          src={brand.logoImage}
          alt="Love Creamery"
        />
      ) : (
        <>
          <span className="wordmark">
            LOVE<span>CREAMERY</span>
          </span>
        </>
      )}
      <span className="guide-label">DIETARY GUIDE</span>
    </>
  );
}
function App() {
  const [catalog, setCatalog] = useState<Flavor[]>(load),
    [selectedLocations, setSelectedLocations] = useState<string[]>([]),
    [detailFlavor, setDetailFlavor] = useState<Flavor>(),
    [needs, setNeeds] = useState<Need[]>([]),
    [applied, setApplied] = useState<Need[]>([]),
    [found, setFound] = useState(false),
    [tab, setTab] = useState("explore"),
    [question, setQuestion] = useState(""),
    [reply, setReply] = useState(""),
    [selected, setSelected] = useState<Flavor>(),
    [edit, setEdit] = useState<Flavor | null>(null),
    [notice, setNotice] = useState(loadWarning),
    [catalogView, setCatalogView] = useState("official"),
    [flavorSearch, setFlavorSearch] = useState("");
  function save(next: Flavor[]) {
    try {
      validateCatalog(next);
      localStorage.setItem(key, JSON.stringify(next));
      setCatalog(next);
      setNotice("Catalog saved in this browser.");
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save");
      return false;
    }
  }
  function ask(q: string) {
    setQuestion(q);
    setReply(answer(q, activeCatalog, selectedLocations, selected));
  }
  const activeCatalog = catalog.filter(
    (f) => catalogView === "all" || (catalogView === "demo" ? f.demo : !f.demo),
  );
  const visible = activeCatalog.filter(
    (f) =>
      !f.archived &&
      matchesLocations(f, selectedLocations) &&
      f.name.toLowerCase().includes(flavorSearch.toLowerCase().trim()),
  );
  return (
    <>
      <header>
        <a className="brand" href="#">
          <BrandMark />
        </a>
        <nav>
          <button
            className={tab === "explore" ? "active" : ""}
            onClick={() => setTab("explore")}
          >
            Find your flavors
          </button>
          <button
            className={tab === "manage" ? "active" : ""}
            onClick={() => setTab("manage")}
          >
            Manage catalog
          </button>
        </nav>
        <span className="independent">Independent community prototype</span>
      </header>
      <main>
        <div className="hero">
          <div>
            <div className="eyebrow">SMALL-BATCH SPIRIT. BIG SCOOP ENERGY.</div>
            <h1>
              Big scoop.
              <br />
              <em>Little guesswork.</em>
            </h1>
            <p>
              A little playful. A little particular. Explore the flavor guide,
              find your preferences, and bring your ingredient questions to the
              scoop counter.
            </p>
            <div className="hero-tags">
              <span>♡ Made for your preferences</span>
              <span>✧ Honest about the unknowns</span>
            </div>
          </div>
          <figure className="hero-visual has-photo">
            <div className="packaging-shape shape-circle" aria-hidden="true" />
            <div className="packaging-shape shape-checker" aria-hidden="true" />
            <img
              className="hero-photo"
              src={brand.heroImage}
              alt={brand.heroAlt}
              width="1500"
              height="1000"
              fetchPriority="high"
            />
            <span className="scoop-sticker" aria-hidden="true">
              made with
              <br />
              <b>a little love</b>
              <span>✦</span>
            </span>
            <figcaption>{brand.heroCredit}</figcaption>
          </figure>
        </div>
        <aside className="safety">
          <strong>Allergies? Read this first.</strong>
          <p>
            Love Creamery is not an allergen-free facility. Cross-contact may
            occur. Vegan and gluten-free labels do not guarantee allergy safety.
            For serious allergies, confirm ingredients and preparation practices
            directly with the shop.
          </p>
        </aside>
        <div className="demo-banner">
          Official menu descriptions and dietary labels are source documented.
          Separate demonstration flavors are fictional. Menu listings do not
          confirm live stock.
        </div>
        <aside
          className="nutrition-disclaimer"
          aria-label="Fictional nutrition disclaimer"
        >
          <strong>Fictional nutrition examples — read before using.</strong>
          <p>
            Calories, sugars, protein, and all other seeded nutrition numbers —
            including serving sizes — are invented examples, not official Love
            Creamery values or calculated estimates. Do not use them for medical
            diets. Dyes and other missing ingredient information remain unknown
            for real flavors.
          </p>
          <details>
            <summary>What we found online · checked {research.checked}</summary>
            {research.sources.map((source) => (
              <p key={source.url}>
                <a href={source.url}>{source.url}</a>
                <br />
                {source.finding}
              </p>
            ))}
            <p>{research.searches}</p>
            <p>
              The FAQ’s 18–19% butterfat statement is general information and is
              not converted into per-serving fat grams.
            </p>
          </details>
        </aside>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {tab === "explore" ? (
          <>
            <section className="planner">
              <div className="section-title">
                <div>
                  <span className="eyebrow">LET’S FIND YOUR SCOOP</span>
                  <h2>Let’s find your kind of scoop.</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setNeeds([]);
                    setApplied([]);
                    setFound(false);
                    setSelectedLocations([]);
                    setFlavorSearch("");
                    setSelected(undefined);
                    setReply("");
                  }}
                >
                  Reset filters ↺
                </button>
              </div>
              <div className="step">
                <span className="number">01</span>
                <div className="step-content">
                  <h3>Where are you headed?</h3>
                  <p>
                    Choose one or more shops. Flavors listed at any selected
                    shop appear once.
                  </p>
                  <div className="locations">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        className={
                          "location " +
                          (selectedLocations.includes(l.id) ? "chosen" : "")
                        }
                        aria-pressed={selectedLocations.includes(l.id)}
                        onClick={() => {
                          setSelectedLocations((current) =>
                            current.includes(l.id)
                              ? current.filter((id) => id !== l.id)
                              : [...current, l.id],
                          );
                          setFound(false);
                          setReply("");
                          setSelected(undefined);
                        }}
                      >
                        <span>⌖</span>
                        <strong>{l.name}</strong>
                        <small>{l.city}</small>
                        {selectedLocations.includes(l.id) && (
                          <b aria-hidden="true">✓</b>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="step">
                <span className="number">02</span>
                <div className="step-content">
                  <h3>What should we keep in mind?</h3>
                  <p>
                    Pick all that apply. Every selection is checked
                    independently.
                  </p>
                  <div className="filters">
                    {(["vegan", "gluten-free", ...allergens] as Need[]).map(
                      (n) => (
                        <label
                          className={needs.includes(n) ? "checked" : ""}
                          key={n}
                        >
                          <input
                            type="checkbox"
                            checked={needs.includes(n)}
                            onChange={() =>
                              setNeeds(
                                needs.includes(n)
                                  ? needs.filter((v) => v !== n)
                                  : [...needs, n],
                              )
                            }
                          />
                          {labels[n]}
                          {allergens.includes(n as any) ? " allergy" : ""}
                        </label>
                      ),
                    )}
                  </div>
                  <button
                    className="primary"
                    disabled={!selectedLocations.length}
                    onClick={() => {
                      setApplied([...needs]);
                      setFound(true);
                    }}
                  >
                    Find My Flavors <span>→</span>
                  </button>
                  {!selectedLocations.length && (
                    <small className="hint">
                      Select a location to get started.
                    </small>
                  )}
                </div>
              </div>
            </section>
            {found && (
              <section className="results">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">YOUR FLAVOR GUIDE</span>
                    <h2>
                      {locations
                        .filter((l) => selectedLocations.includes(l.id))
                        .map((l) => l.name)
                        .join(" + ")}{" "}
                      scoops
                    </h2>
                  </div>
                  <span>
                    {visible.length} catalog entries · Stock unconfirmed
                  </span>
                </div>
                <div className="catalog-controls">
                  <label>
                    Catalog entries
                    <select
                      value={catalogView}
                      onChange={(e) => {
                        setCatalogView(e.target.value);
                        setSelected(undefined);
                        setReply("");
                      }}
                    >
                      <option value="official">Official menu listings</option>
                      <option value="demo">
                        Fictional demonstration flavors
                      </option>
                      <option value="all">All entries</option>
                    </select>
                  </label>
                  <label>
                    Search flavor names
                    <input
                      type="search"
                      value={flavorSearch}
                      onChange={(e) => setFlavorSearch(e.target.value)}
                      placeholder="e.g. Salted Caramel"
                    />
                  </label>
                </div>
                {!visible.length && (
                  <p>
                    No entries match this view. Try another location or catalog,
                    clear the search, or add the latest shop listings in Manage
                    catalog.
                  </p>
                )}
                {(
                  [
                    "Matches documented restrictions",
                    "Needs confirmation",
                    "Does not match",
                  ] as const
                ).map((group) => (
                  <div key={group}>
                    <h3>
                      {group}{" "}
                      <small>
                        (
                        {
                          visible.filter((f) => classify(f, applied) === group)
                            .length
                        }
                        )
                      </small>
                    </h3>
                    <div className="cards">
                      {visible
                        .filter((f) => classify(f, applied) === group)
                        .map((f) => (
                          <article className="flavor" key={f.id}>
                            <button
                              type="button"
                              className="flavor-card-button"
                              aria-label={`View details for ${f.name}`}
                              aria-haspopup="dialog"
                              onClick={() => {
                                setSelected(f);
                                setDetailFlavor(f);
                              }}
                            >
                              <FlavorImage flavor={f} compact />
                              <div className="card-body">
                                <h3>
                                  {f.name}
                                  {f.demo && (
                                    <small className="fictional-name-note">
                                      {" "}
                                      (fictional example)
                                    </small>
                                  )}
                                </h3>
                                <p>{f.description}</p>
                              </div>
                            </button>
                          </article>
                        ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
            <section className="shop-story" aria-labelledby="shop-story-title">
              <figure>
                <img
                  src={brand.storeImage}
                  alt={brand.storeAlt}
                  width="900"
                  height="600"
                  loading="lazy"
                />
                <figcaption>
                  Lincoln Park, Duluth · photograph from Love Creamery’s website
                </figcaption>
              </figure>
              <div>
                <span className="eyebrow">
                  FROM THE NEIGHBORHOOD SCOOP SHOP
                </span>
                <h2 id="shop-story-title">
                  A little local love.
                  <br />A lot of personality.
                </h2>
                <p>
                  Colorful cups. The winged ice cream cone. A stop worth looking
                  forward to. Bring that same curiosity to ingredients: use this
                  guide to prepare questions for the scoop counter.
                </p>
                <p className="story-note">
                  Real shop imagery; seeded nutrition numbers are fictional
                  examples. A photograph cannot confirm ingredients, allergens,
                  or availability.
                </p>
                <a className="story-link" href="https://www.lovecreamery.com/">
                  Visit Love Creamery’s official website ↗
                </a>
              </div>
            </section>
            <section id="assistant" className="assistant">
              <div>
                <span className="eyebrow">A LITTLE HELP, RIGHT HERE</span>
                <h2>Questions before the first spoonful?</h2>
                <p>
                  Our local guide checks the same catalog and dietary rules. No
                  AI, no guessing.
                </p>
                <small>
                  It understands supported phrases, not every natural-language
                  question. It cannot discover missing ingredients or live
                  stock.
                </small>
              </div>
              <div>
                <div className="suggestions">
                  {[
                    "Which flavors are vegan and gluten-free?",
                    "I’m allergic to peanuts. What can I have?",
                    "Are there dairy-free chocolate flavors?",
                    "How many calories and sugars in Salted Caramel?",
                    "Does Salted Caramel have dyes?",
                  ].map((q) => (
                    <button key={q} onClick={() => ask(q)}>
                      {q} ↗
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(question);
                  }}
                >
                  <label htmlFor="question">
                    {selected
                      ? `Ask about ${selected.name}`
                      : "Ask the flavor guide"}
                  </label>
                  <div className="question-input">
                    <input
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g. Which flavors contain eggs?"
                      required
                    />
                    <button
                      className="primary"
                      disabled={!selectedLocations.length}
                    >
                      Ask →
                    </button>
                  </div>
                  {!selectedLocations.length && (
                    <small>Select a location first.</small>
                  )}
                </form>
                {reply && (
                  <div className="reply" role="status">
                    {reply}
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="planner">
            <div className="section-title">
              <h2>Your local catalog</h2>
              <button
                className="primary"
                onClick={() =>
                  setEdit({
                    id: crypto.randomUUID(),
                    name: "",
                    description: "",
                    ingredients: "Unknown",
                    color: "#cb9aa4",
                    vegan: "unknown",
                    glutenFree: "unknown",
                    allergens: Object.fromEntries(
                      allergens.map((a) => [a, "unknown"]),
                    ) as Flavor["allergens"],
                    locations: [],
                    availability: "unknown",
                    season: "Unknown",
                    verified: "",
                    source: "User-entered demonstration; not verified",
                    demo: true,
                    archived: false,
                    ingredientsComplete: "unknown",
                    nutrition: emptyNutrition(),
                    ingredientInfo: emptyIngredientInfo(),
                  })
                }
              >
                + Add flavor
              </button>
            </div>
            <p>
              This editor has no authentication. Changes affect only this
              browser. Update src/catalog.json and redeploy to share defaults
              with everyone. Export a backup before switching browsers.
            </p>
            <div className="tools">
              <button
                onClick={() => {
                  const ids = new Set(catalog.map((f) => f.id));
                  const additions = validateCatalog(initial).filter(
                    (f) => !f.demo && !ids.has(f.id),
                  );
                  if (additions.length) save([...catalog, ...additions]);
                  else
                    setNotice(
                      "All researched shop listings are already in this browser catalog.",
                    );
                }}
              >
                Add latest shop listings
              </button>
              <button
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(catalog, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "love-creamery-catalog.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON ↓
              </button>
              <label className="import">
                Import JSON{" "}
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        if (file.size > 2000000)
                          throw Error("File must be under 2 MB");
                        const parsed = validateCatalog(
                          JSON.parse(await file.text()),
                        );
                        if (
                          confirm(
                            "Replace this browser’s entire catalog with the imported file?",
                          )
                        )
                          save(parsed);
                      } catch (err) {
                        setNotice(
                          err instanceof Error ? err.message : "Import failed",
                        );
                      }
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            {catalog.map((f) => (
              <div className="manage-row" key={f.id}>
                <strong>
                  {f.name}
                  {f.archived ? " (archived)" : ""}
                </strong>
                <div>
                  <button onClick={() => setEdit(structuredClone(f))}>
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      save(
                        catalog.map((v) =>
                          v.id === f.id ? { ...v, archived: !v.archived } : v,
                        ),
                      )
                    }
                  >
                    {f.archived ? "Restore" : "Archive"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${f.name}?`))
                        save(catalog.filter((v) => v.id !== f.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {edit && (
              <form
                className="editor"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (save([...catalog.filter((f) => f.id !== edit.id), edit]))
                    setEdit(null);
                }}
              >
                <h3>{edit.name || "New flavor"}</h3>
                {(
                  [
                    "name",
                    "description",
                    "ingredients",
                    "season",
                    "source",
                    "verified",
                  ] as const
                ).map((k) => (
                  <label key={k}>
                    {k === "verified"
                      ? "Last verified (required for real entries)"
                      : k}
                    <input
                      type={k === "verified" ? "date" : "text"}
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.value })
                      }
                      required={k === "name" || k === "source"}
                    />
                  </label>
                ))}
                <label>
                  Illustration color
                  <input
                    type="color"
                    value={edit.color}
                    onChange={(e) =>
                      setEdit({ ...edit, color: e.target.value })
                    }
                  />
                </label>
                {(["vegan", "glutenFree", "availability"] as const).map((k) => (
                  <label key={k}>
                    {k}
                    <select
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.value })
                      }
                    >
                      {(k === "availability"
                        ? ["unknown", "available", "unavailable"]
                        : ["unknown", "yes", "no"]
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                ))}
                {allergens.map((a) => (
                  <label key={a}>
                    {labels[a]}
                    <select
                      value={edit.allergens[a]}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          allergens: { ...edit.allergens, [a]: e.target.value },
                        } as Flavor)
                      }
                    >
                      {(["unknown", "contains", "absent"] as const).map((s) => (
                        <option value={s} key={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <NutritionEditor flavor={edit} onChange={setEdit} />
                <fieldset>
                  <legend>Associated locations</legend>
                  {locations.map((l) => (
                    <label key={l.id}>
                      <input
                        type="checkbox"
                        checked={edit.locations.includes(l.id)}
                        onChange={() =>
                          setEdit({
                            ...edit,
                            locations: edit.locations.includes(l.id)
                              ? edit.locations.filter((id) => id !== l.id)
                              : [...edit.locations, l.id],
                          })
                        }
                      />
                      {l.name}
                    </label>
                  ))}
                </fieldset>
                <label>
                  <input
                    type="checkbox"
                    checked={edit.demo}
                    onChange={(e) =>
                      setEdit({ ...edit, demo: e.target.checked })
                    }
                  />
                  Demonstration data (uncheck only with documented evidence)
                </label>
                <div>
                  <button className="primary">Save flavor</button>
                  <button type="button" onClick={() => setEdit(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
        <footer>
          <span className="brand">
            <BrandMark />
          </span>
          <p>
            Independent prototype · Not affiliated with or endorsed by Love
            Creamery.
            <br />
            Reference resources:{" "}
            <a href="https://lovecreamery.com/ice-cream-flavors/">
              Official flavors
            </a>{" "}
            · <a href="https://lovecreamery.com/faqs/">Official FAQs</a>
            <br />
            Packaging reference:{" "}
            <a href={brand.referenceUrl}>Matthew G. Olin and Jacey Kufahl</a>.
            <br />
            Brand images do not verify nutrition or ingredient claims. Confirm
            products and ingredients directly with the shop.
          </p>
        </footer>
      </main>
      {detailFlavor && (
        <FlavorDetails
          flavor={detailFlavor}
          needs={applied}
          onClose={() => setDetailFlavor(undefined)}
          onAsk={() => {
            setSelected(detailFlavor);
            ask(`Does ${detailFlavor.name} contain eggs?`);
            setDetailFlavor(undefined);
            requestAnimationFrame(() => {
              document
                .getElementById("question")
                ?.focus({ preventScroll: true });
              document
                .getElementById("assistant")
                ?.scrollIntoView({ behavior: "smooth" });
            });
          }}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
