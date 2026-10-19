# Love Creamery Dietary Guide

An independent React + TypeScript test prototype with a read-only customer catalog. No paid services, AI APIs, keys, database, or cloud accounts are required.

## Run and test

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

`npm run build` type-checks and builds `dist/`; `npm run preview` serves the production build. `npm test` runs the logic tests. In restricted environments use `npm ci --cache /workspace/.npm-cache`.

With the dev or preview server running, run `npx playwright install chromium` once, then `npm run test:browser`. On this cloud machine, use `BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser`. Set `TEST_BASE_URL` to the server under test, for example the production preview on port 4173. Browser checks cover multiple locations, deduplicated results, dietary groups, compact cards, nutrition and store details, keyboard/mobile dialogs, all 45 photos, image fallback, and the absence of editing and old customer overrides.

## Customer experience

Choose one or more locations, select dietary preferences/allergies, and click **Find My Flavors**. Flavors associated with any selected location appear once. Cards show an image, name, and description. Open a card for associated stores, dietary/allergen information, nutrition and ingredients. Close with the button, Escape, or backdrop; focus returns to the card. Search narrows flavor names; Reset clears filters. The separate **Ask a question** tab is available immediately, with no browse filters required. It searches all three locations by default, regardless of the browse tab's selections. Mention Canal Park, Lincoln Park, or Billings Park to narrow a question; Duluth means Canal Park plus Lincoln Park, and Superior means Billings Park. The question assistant uses the same stored catalog and dietary classification rules. Dietary recommendations show only matches and flavors needing confirmation; direct questions about a named flavor still explain any conflicting ingredients. Both tabs preserve their state when switching, and arrow/Home/End keys navigate the tab bar. **Ask about this flavor** in a detail dialog switches to Questions with that flavor's context.

There is no customer catalog editor, import/export interface, or browser-save workflow. The app reads its bundled catalog and ignores old `love-creamery-catalog-v1` localStorage overrides without deleting them. This prevents previously saved fictional flavors or customer edits from appearing. Filtering and asking questions do not modify the catalog.

## One main-page test notice

The main page prominently states that this is a test app and the information is not accurate. Nutrition numbers and serving sizes are fictional; ingredients, dietary, allergen, and availability information may be incomplete or inaccurate. The notice also covers cross-contact and direct verification with the shop. Repeated notices were removed from flavor dialogs and customer assistant responses. Unknown fields still display Unknown, and partial ingredient descriptions are not presented as complete recipes.

Do not use this prototype for dietary, allergy, nutrition, or medical decisions. It is not affiliated with or endorsed by Love Creamery. Metadata continues to distinguish documented, fictional, and unknown values even though the notice is consolidated in the customer interface.

## Catalog and research

`src/catalog.json` contains 46 flavor listings researched from https://www.lovecreamery.com/ice-cream-flavors/ on October 19, 2026. The four former fictional product entries are removed from the shipped catalog. Synthetic fixtures used by unit tests live separately under `tests/fixtures/` and are never imported by the application.

Official flavor names, descriptions, dietary badges, and location associations were captured from the menu. Sources and search limitations are in `src/research.json`. No per-flavor nutrition table was found in the official menu, FAQ, three flavor pages, or official site/media searches checked. All seeded nutrition numbers and serving sizes remain fictional test values, not measured facts or calculated estimates. The FAQ's general butterfat percentage is not converted into per-serving fat grams. Real flavors' missing dyes and additive information stays unknown. A generic nuts badge does not identify peanut versus tree nut.

Nutrition data includes serving description/mass, calories, total/saturated/trans fat, cholesterol, sodium, carbohydrates, fiber, total/added sugars, and protein, with explicit units. Null means unknown, not zero. Ingredient facts include base, sweeteners, dyes/colors, artificial flavors, preservatives, sugar alcohols, caffeine, and alcohol, with independent evidence status. Sources and dates remain in the stored schema; invalid numeric values and inconsistent totals are rejected.

Developers update `src/catalog.json` and redeploy to change the shared catalog. Locations are in `src/locations.json`. No client password or hidden editor is provided. No external runtime service is required.

## Images and visual direction

Approximate sky blue, soft yellow, pink, cream, and brown reflect the packaging references; these are not official color specifications. Local assets include the winged logo, blue-background cups photo, and a Lincoln Park storefront photograph. Packaging reference: https://www.matthewolin.com/love-creamery/ , credited to Matthew G. Olin and Jacey Kufahl. Sources are documented in `public/brand/README.md`; configure assets in `src/brand.json`.

45 exact-name flavor photos are stored in `public/flavors/`, with source URLs and dates in `src/flavorPhotos.json`. Apple Cajeta had no matching official photo and retains an illustration. Photos have alt text. Source links and checked dates are kept in developer metadata and documentation, not displayed in the customer app. `python3 scripts/sync-flavor-photos.py` refreshes them using the Python standard library; this is an optional development operation, never a runtime dependency. Imagery does not establish ingredients, nutrition, or stock.

## GitHub checks and deployment

Pushes to `main` and pull requests run `.github/workflows/checks.yml`: clean install, logic tests, production build, and Chromium browser checks. Passing runs upload `dietary-guide-dist`. On `main`, a deployment job then publishes GitHub Pages. Pull requests do not deploy.

Enable **Settings → Pages → GitHub Actions**, then run **Actions → Build and test → Run workflow → main** if needed. GitHub displays the deployed URL after success. Expected project URL: https://carl6916.github.io/LoveCreameryDietaryGuide/ . Build assets use relative paths for project-site hosting.

Customer-facing source links, photo credit links, checked dates, and the “Honest about the unknowns” hero line are removed. Research and asset provenance remain in the JSON metadata and this documentation. The single main-page test disclaimer is retained.
