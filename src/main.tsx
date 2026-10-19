import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import initial from "./catalog.json";
import locations from "./locations.json";
import brand from "./brand.json";
import {
  allergens,
  answer,
  classify,
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
    return validateCatalog(saved ? JSON.parse(saved) : initial);
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
function WingedScoop() {
  return (
    <svg
      className="winged-scoop"
      viewBox="0 0 150 100"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M51 43C33 45 19 36 8 24c-1 20 9 33 30 35M47 53C30 59 20 52 13 45c2 17 15 25 35 20M99 43c18 2 32-7 43-19 1 20-9 33-30 35M103 53c17 6 27-1 34-8-2 17-15 25-35 20" />
      <path d="m55 57 20 34 20-34Z" fill="#f8da77" />
      <path d="m62 68 14 10m-7-19 17 14m-1-11L71 83" strokeWidth="2" />
      <path
        d="M51 53c-5-7-2-15 5-18-1-12 8-22 20-21 12 0 21 10 20 21 7 4 9 12 4 18-5 6-12 4-17 0-5 5-12 5-17 0-5 5-11 5-15 0Z"
        fill="#efb6c9"
      />
      <path d="m69 6 5-4m13 5 3-5m-36 8-3-4" strokeWidth="2" />
    </svg>
  );
}
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
          <WingedScoop />
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
    [loc, setLoc] = useState(""),
    [needs, setNeeds] = useState<Need[]>([]),
    [applied, setApplied] = useState<Need[]>([]),
    [found, setFound] = useState(false),
    [tab, setTab] = useState("explore"),
    [question, setQuestion] = useState(""),
    [reply, setReply] = useState(""),
    [selected, setSelected] = useState<Flavor>(),
    [edit, setEdit] = useState<Flavor | null>(null),
    [notice, setNotice] = useState(loadWarning);
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
    setReply(answer(q, catalog, loc, selected));
  }
  const visible = catalog.filter(
    (f) => !f.archived && f.locations.includes(loc),
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
          <figure
            className={
              "hero-visual " + (brand.heroImage ? "has-photo" : "illustrated")
            }
          >
            <div className="packaging-shape shape-circle" aria-hidden="true" />
            <div className="packaging-shape shape-checker" aria-hidden="true" />
            {brand.heroImage ? (
              <img
                className="hero-photo"
                src={brand.heroImage}
                alt={brand.heroAlt}
                fetchPriority="high"
              />
            ) : (
              <div className="pint-scene" aria-hidden="true">
                <div className="pint pint-pink">
                  <div className="pint-lid" />
                  <WingedScoop />
                  <span>
                    LOVE
                    <br />
                    CREAMERY
                  </span>
                  <div className="pint-pattern" />
                </div>
                <div className="pint pint-blue">
                  <div className="pint-lid" />
                  <WingedScoop />
                  <span>
                    LOVE
                    <br />
                    CREAMERY
                  </span>
                  <div className="pint-pattern" />
                </div>
                <span className="scene-spark">✦</span>
              </div>
            )}
            <span className="scoop-sticker" aria-hidden="true">
              made with
              <br />
              <b>a little love</b>
              <span>✦</span>
            </span>
            <figcaption>
              {brand.heroImage
                ? brand.heroCredit
                : "Packaging-inspired illustration · not a product photograph"}
            </figcaption>
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
          {catalog.some((f) => f.demo)
            ? "DEMONSTRATION DATA INCLUDED · Fictional entries demonstrate this guide and are not verified Love Creamery products. No demonstration stock is confirmed."
            : "LOCAL CATALOG · User-supplied documentation; confirm current stock and preparation directly with the shop."}
        </div>
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
                  }}
                >
                  Reset filters ↺
                </button>
              </div>
              <div className="step">
                <span className="number">01</span>
                <div className="step-content">
                  <h3>Where are you headed?</h3>
                  <p>Choose a shop to explore its associated catalog.</p>
                  <div className="locations">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        className={"location " + (loc === l.id ? "chosen" : "")}
                        onClick={() => {
                          setLoc(l.id);
                          setFound(false);
                          setReply("");
                          setSelected(undefined);
                        }}
                      >
                        <span>⌖</span>
                        <strong>{l.name}</strong>
                        <small>{l.city}</small>
                        {loc === l.id && <b>✓</b>}
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
                    disabled={!loc}
                    onClick={() => {
                      setApplied([...needs]);
                      setFound(true);
                    }}
                  >
                    Find My Flavors <span>→</span>
                  </button>
                  {!loc && (
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
                    <h2>{locations.find((l) => l.id === loc)?.name} scoops</h2>
                  </div>
                  <span>
                    {visible.length} catalog entries · Stock unconfirmed
                  </span>
                </div>
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
                            <div
                              className="flavor-art"
                              style={{ background: f.color + "30" }}
                            >
                              <div
                                style={{ background: f.color }}
                                className="mini-scoop"
                              />
                              <span>
                                {f.demo ? "DEMONSTRATION" : "DOCUMENTED ENTRY"}
                              </span>
                            </div>
                            <div className="card-body">
                              <h3>{f.name}</h3>
                              <p>{f.description}</p>
                              <div className="badges">
                                <span>Vegan: {f.vegan}</span>
                                <span>Gluten-free: {f.glutenFree}</span>
                              </div>
                              <dl>
                                {allergens.map((a) => (
                                  <React.Fragment key={a}>
                                    <dt>{labels[a]}</dt>
                                    <dd>{statusLabel[f.allergens[a]]}</dd>
                                  </React.Fragment>
                                ))}
                              </dl>
                              <p>
                                <strong>Ingredients:</strong> {f.ingredients}
                              </p>
                              <p>
                                <strong>Locations:</strong>{" "}
                                {f.locations
                                  .map(
                                    (id) =>
                                      locations.find((l) => l.id === id)?.name,
                                  )
                                  .join(", ")}
                                <br />
                                <strong>Availability:</strong> {f.availability}
                                <br />
                                <strong>Season:</strong> {f.season}
                                <br />
                                <strong>Last verified:</strong>{" "}
                                {f.verified || "Not verified — demonstration"}
                                <br />
                                <strong>Source:</strong> {f.source}
                              </p>
                              {f.demo && (
                                <small>
                                  “Verified” absence values describe this
                                  fictional recipe only.
                                </small>
                              )}
                              <button
                                className="text-button"
                                onClick={() => {
                                  setSelected(f);
                                  ask(`Does ${f.name} contain eggs?`);
                                  document
                                    .getElementById("assistant")
                                    ?.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                Ask about this flavor →
                              </button>
                            </div>
                          </article>
                        ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
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
                    <button className="primary" disabled={!loc}>
                      Ask →
                    </button>
                  </div>
                  {!loc && <small>Select a location first.</small>}
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
            Official product details were unavailable during development.
            Confirm directly with the shop.
          </p>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
