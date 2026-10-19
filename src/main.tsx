import { useState } from "react";
import { createRoot } from "react-dom/client";
import initial from "./catalog.json";
import locations from "./locations.json";
import brand from "./brand.json";
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
const catalog = validateCatalog(initial).filter(
  (flavor) => !flavor.demo && !flavor.archived,
);
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
  const [tab, setTab] = useState<"flavors" | "questions">("flavors"),
    [selectedLocations, setSelectedLocations] = useState<string[]>([]),
    [detailFlavor, setDetailFlavor] = useState<Flavor>(),
    [needs, setNeeds] = useState<Need[]>([]),
    [applied, setApplied] = useState<Need[]>([]),
    [found, setFound] = useState(false),
    [question, setQuestion] = useState(""),
    [reply, setReply] = useState(""),
    [selected, setSelected] = useState<Flavor>(),
    [flavorSearch, setFlavorSearch] = useState("");
  function ask(q: string) {
    setQuestion(q);
    setReply(answer(q, catalog, undefined, selected, { showNotices: false }));
  }
  const visible = catalog.filter(
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
        <nav aria-label="Guide sections">
          <div
            className="guide-tabs"
            role="tablist"
            aria-label="Guide sections"
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? "flavors"
                    : e.key === "End"
                      ? "questions"
                      : tab === "flavors"
                        ? "questions"
                        : "flavors";
                setTab(next);
                requestAnimationFrame(() =>
                  document.getElementById(`tab-${next}`)?.focus(),
                );
              }
            }}
          >
            <button
              id="tab-flavors"
              type="button"
              role="tab"
              aria-controls="flavors-panel"
              aria-selected={tab === "flavors"}
              tabIndex={tab === "flavors" ? 0 : -1}
              className={tab === "flavors" ? "active" : ""}
              onClick={() => setTab("flavors")}
            >
              Find your flavors
            </button>
            <button
              id="tab-questions"
              type="button"
              role="tab"
              aria-controls="assistant"
              aria-selected={tab === "questions"}
              tabIndex={tab === "questions" ? 0 : -1}
              className={tab === "questions" ? "active" : ""}
              onClick={() => setTab("questions")}
            >
              Ask a question
            </button>
          </div>
        </nav>
        <span className="independent">Flavor & ingredient guide</span>
      </header>
      <main>
        {tab === "flavors" && (
          <div className="hero">
            <div>
              <div className="eyebrow">
                SMALL-BATCH SPIRIT. BIG SCOOP ENERGY.
              </div>
              <h1>
                Big scoop.
                <br />
                <em>Little guesswork.</em>
              </h1>
              <p>
                A little playful. A little particular. Explore the flavor guide,
                find your preferences, and bring your ingredient questions to
                the scoop counter.
              </p>
              <div className="hero-tags">
                <span>♡ Made for your preferences</span>
              </div>
            </div>
            <figure className="hero-visual has-photo">
              <div
                className="packaging-shape shape-circle"
                aria-hidden="true"
              />
              <div
                className="packaging-shape shape-checker"
                aria-hidden="true"
              />
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
            </figure>
          </div>
        )}
        <aside className="test-notice" aria-label="Test information disclaimer">
          <strong>This is a test app. The information is not accurate.</strong>
          <p>
            Nutrition numbers and serving sizes are fictional examples.
            Ingredient, dietary, allergen, and availability information may be
            incomplete or inaccurate. Do not use this app for dietary, allergy,
            or medical decisions. Love Creamery is not an allergen-free
            facility, and cross-contact may occur. Confirm real information
            directly with the shop. This independent prototype is not affiliated
            with or endorsed by Love Creamery.
          </p>
        </aside>
        <div
          id="flavors-panel"
          role="tabpanel"
          aria-labelledby="tab-flavors"
          hidden={tab !== "flavors"}
        >
          <section id="flavor-finder" className="planner">
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
                  Choose one or more shops. Flavors listed at any selected shop
                  appear once.
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
                  Pick all that apply. Every selection is checked independently.
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
                  No entries match this view. Try another location, clear the
                  search, or reset your filters.
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
                              <h3>{f.name}</h3>
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
              <figcaption>Lincoln Park, Duluth</figcaption>
            </figure>
            <div>
              <span className="eyebrow">FROM THE NEIGHBORHOOD SCOOP SHOP</span>
              <h2 id="shop-story-title">
                A little local love.
                <br />A lot of personality.
              </h2>
              <p>
                Colorful cups. The winged ice cream cone. A stop worth looking
                forward to. Bring that same curiosity to ingredients: use this
                guide to prepare questions for the scoop counter.
              </p>
            </div>
          </section>
        </div>
        <section
          id="assistant"
          className="assistant"
          role="tabpanel"
          aria-labelledby="tab-questions"
          hidden={tab !== "questions"}
        >
          <div>
            <span className="eyebrow">A LITTLE HELP, RIGHT HERE</span>
            <h2>Questions before the first spoonful?</h2>
            <p>
              No filters needed. Ask about any flavor, ingredient, or dietary
              preference.
            </p>
            <p className="question-scope">
              Answers cover all locations unless you mention a shop or city in
              your question. Try Canal Park, Lincoln Park, Billings Park,
              Duluth, or Superior.
            </p>
            <small>
              It understands supported phrases, not every natural-language
              question. It cannot discover missing ingredients or live stock.
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
              <label htmlFor="question">Ask the flavor guide</label>
              <div className="question-input">
                <input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Which flavors contain eggs?"
                  required
                />
                <button className="primary" disabled={!question.trim()}>
                  Ask →
                </button>
              </div>
            </form>
            {reply && (
              <div className="reply" role="status">
                {reply}
              </div>
            )}
          </div>
        </section>
        <footer>
          <span className="brand">
            <BrandMark />
          </span>
          <p>Flavor & ingredient guide</p>
        </footer>
      </main>
      {detailFlavor && (
        <FlavorDetails
          flavor={detailFlavor}
          needs={applied}
          onClose={() => setDetailFlavor(undefined)}
          onAsk={() => {
            setSelected(detailFlavor);
            setTab("questions");
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
