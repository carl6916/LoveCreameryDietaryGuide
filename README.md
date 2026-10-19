# Love Creamery Dietary Guide

An independent React + TypeScript prototype. No backend, paid services, AI APIs, keys, or cloud accounts. Not affiliated with or endorsed by Love Creamery.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. `npm run build` type-checks and produces `dist/`; `npm run preview` serves the production build. `npm test` checks filtering, assistant responses, unknown values, location handling, and JSON validation. In restricted environments use `npm ci --cache /workspace/.npm-cache`.

## Customer workflow

Choose one or more shops (Canal Park, Lincoln Park, and/or Billings Park), select any combination of restrictions, then click **Find My Flavors**. Location buttons toggle independently and expose their selected state. Results include flavors associated with **any** selected shop, with each flavor appearing only once. Change the selection and search again; **Reset filters** clears locations, restrictions, and name search. At least one location is required to search or ask the assistant.

Results separate dietary matches, incomplete information, and conflicts. Each result card contains only an image, name, and short description. Click the card (or use Enter/Space) to open the flavor detail dialog. The dialog shows all associated store locations, dietary labels, allergens, ingredients, full nutrition, source dates, and availability caveats. Listed stores are catalog associations, never confirmation of live stock. Close with the Close button, Escape, or by clicking the backdrop; keyboard focus returns to the original card. Nutrition and ingredient detail is expanded inside the dialog, and an **Ask about this flavor** button opens the local assistant with flavor context. The catalog selector separates official menu listings from fictional demonstration flavors; name search narrows large result lists. An unknown availability value never establishes current stock.

The question guide uses local keywords, synonyms, full flavor names, store names, and the same classification function as filtering. It can report ingredients, allergen status, calories, sugars, protein, and other stored nutrition facts. Try “How many calories and sugars in Salted Caramel?” or “Does Salted Caramel have dyes?” Invented values are always identified as fictional; unknown ingredient fields remain unknown. “Ask about this flavor” selects context. The assistant uses all selected shops unless the question explicitly names a shop or multiple shops. The guide lists conflicts and unknowns explicitly alongside matches; do not interpret every returned entry as a recommendation. Unsupported questions prompt supported examples. It cannot interpret every phrase, discover information, or check live inventory.

## Data, nutrition, and provenance

The catalog contains **46 source-documented Love Creamery flavor listings** collected from the official flavors page on October 19, 2026, plus the four clearly labeled fictional demonstration flavors. Names, descriptions, GF/V/S badges, and location associations come from https://www.lovecreamery.com/ice-cream-flavors/ . These listings combine scoops and pint associations and do not establish live stock or a serving format. A generic nuts badge does not establish whether a specific nut or peanut is present; unknown allergy fields stay unknown. Only specifically described ingredients or explicit labels are used as evidence.

**All seeded numeric nutrition values and their serving sizes are fictional.** They were invented for testing, not measured, calculated from recipes, or inferred from the official descriptions. Each flavor detail repeats this warning directly above the numbers, and the assistant repeats it in nutrition answers. Do not use invented values for medical diets or nutrition decisions.

Nutrition storage includes serving description and mass; calories; total, saturated, and trans fat; cholesterol; sodium; total carbohydrates; fiber; total and added sugars; and protein. Values are per stored serving with explicit kcal/g/mg units. `null` means unknown and is never treated as zero. Nutrition has its own documented/fictional/unknown status, source, and verification date, independent of whether the flavor name is real. Documented values require source/date evidence; inconsistent totals, negative or nonnumeric values, missing serving descriptions, and invalid dates are rejected.

Ingredient facts include base/milk type, sweeteners, dyes/added colors, artificial flavors, preservatives, sugar alcohols, caffeine, and alcohol. Each field has its own evidence status. Real flavor descriptions are partial ingredient information, never full recipes. Missing additive details remain unknown; no dye-free or allergen-free conclusion is drawn from missing information. Demo flavors include explicitly fictional ingredient examples. Documented ingredient fields share an editable source and checked date.

The official flavors page, FAQ, three individual flavor pages, and official site/media searches were checked. No per-flavor nutrition table was found in those sources. The FAQ's 18–19% butterfat figure is general information, not per-serving total fat, and is not used to compute nutrition. Research findings and exact sources are in `src/research.json`; this is a limited official-source search, not a claim that information exists nowhere else. The app does not independently authenticate future editor-supplied values.

Love Creamery is not an allergen-free facility; cross-contact may occur. A recipe match is never a guarantee of allergy safety. Vegan is independent of milk allergen status. Gluten-free does not establish protection from cross-contact. Unknown is not absence. Customers with serious allergies must confirm ingredients and preparation practices directly with the shop.

## Manage the catalog

Open **Manage catalog** to add, edit, archive, restore, or delete flavors. Every allergen has an explicit Contains / Not listed as an ingredient (verified) / Unknown value. Set independent vegan and gluten-free values. Real entries require a source and verification date; editors are responsible for accurate evidence. Dates are not automatically refreshed or independently verified by the application.

Older catalogs without the new fields automatically receive unknown values without changing existing names, ingredients, or edits. The browser storage key stays `love-creamery-catalog-v1` for compatibility. If you already have a saved catalog, **Add latest shop listings** adds missing official entries without overwriting existing records; repeating it does not create duplicates. Existing edited or deleted records are never silently replaced with new defaults. Explicitly adding latest listings can restore a missing researched entry. New nutrition values in an old custom record remain unknown until edited.

Changes are saved under `love-creamery-catalog-v1` in browser localStorage. They persist after refresh only in that browser and origin. Storage can be cleared or unavailable; save failures are displayed. There is no secure administrator authentication and no shared multi-user publishing. Export JSON for backups; import validates the full schema and asks before replacing the browser catalog. Imported real data is user supplied, not independently authenticated. Do not store confidential information.

For shared defaults, update `src/catalog.json` and redeploy the built static site. Locations are editable in `src/locations.json`; import validation reads the location IDs from the same file. The application uses no external runtime requests or fonts. Brand photographs are stored locally; demonstration flavor illustrations are CSS.

## Automated browser checks

With the dev server running, run `npx playwright install chromium` once, then `npm run test:browser` in another terminal. On this cloud machine, Chromium is already installed: use `BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser`. Set `TEST_BASE_URL` to test another server or the production preview. The test uses an isolated browser profile and covers filters, locations, ingredient questions, CRUD, refresh persistence, export/import, invalid imports, and mobile overflow. It writes screenshots to the operating system temporary directory. Browser tests need Chromium only during development, never for application users.

## Manual acceptance checks

- Choose multiple locations and search; confirm union results contain only associated, nonarchived flavors without duplicates. Toggle shops off, and confirm the search is disabled when no shops are selected. Select **Fictional demonstration flavors** for the original four test flavors; official menu listings are shown by default.
- Confirm compact cards contain image, name, and description. Open a card and verify all associated store locations are listed, nutrition is explicitly fictional, quantities have units and a serving, and unreported dyes remain unknown. Check Close, Escape, backdrop dismissal, focus restoration, and mobile dialog scrolling.
- In the editor, set nutrition evidence, serving, values, and ingredient evidence. Save, refresh, export, and reimport to verify all new fields persist. Clear a number to represent unknown rather than zero.
- Vegan + gluten-free: Coconut Cocoa and Summer Berry match at Canal Park. Adding milk allergy moves Coconut Cocoa to Needs confirmation.
- Peanut allergy: Summer Berry matches its fictional recipe, Vanilla Bean needs confirmation, Peanut Cookie Crunch conflicts at Billings Park.
- Ask “Does Vanilla Bean contain eggs?” and “Does Coconut Cocoa contain milk?”; expect contains and unknown respectively.
- Add/edit/archive/restore an entry; refresh to check persistence. Export, delete, then import the backup to restore it. Invalid JSON should show an error without replacing data.
- At narrow mobile widths, check navigation, filter controls, cards, editor, and question form; use keyboard to navigate all controls.

## GitHub checks

Every push to `main` and every pull request runs `.github/workflows/checks.yml` on GitHub Actions: clean dependency installation, the logic tests, a production build, and Chromium browser checks against that build. The successful run uploads `dietary-guide-dist`, a ZIP containing the static site. See the repository's **Actions** tab for results. After all checks pass on `main`, a separate deployment job publishes the static build to GitHub Pages. Pull requests run checks without deploying.

The build uses relative asset URLs so it can be hosted under a GitHub Pages repository path. Browser catalog changes still remain in each visitor's own browser; they are not written back to GitHub.

## Enable the public test website

In the GitHub repository, open **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source, and save if prompted. Then open **Actions → Build and test → Run workflow**, select `main`, and run it. The deployment follows a passing build, logic tests, and browser tests. GitHub displays the published URL in the deployment job and in Settings → Pages. The expected project URL is `https://carl6916.github.io/LoveCreameryDietaryGuide/`; it works only after Pages is enabled and deployment succeeds. GitHub Actions and Pages must be permitted for the repository and account plan.

The website is a public independent demonstration, not a verified product catalog. Local edits remain in each visitor's browser. Changing the default catalog and pushing to `main` rebuilds and redeploys the site.

## Visual direction and brand assets

The design uses approximate sky blue, soft yellow, pink, warm cream, and chocolate brown, inspired by the Love Creamery packaging project by Matthew G. Olin and Jacey Kufahl. These are not official color specifications. The app now bundles the actual winged logo, the blue-background cups photograph shown in the user's reference, and a Lincoln Park storefront photograph. No external requests are needed to display these images.

Sources and original URLs are documented in `public/brand/README.md`. The packaging portfolio describes work from 2020–2022; images are brand references, not evidence of current recipes or stock. The logo and cups image were matched visually to the supplied references. The low-resolution storefront image embedded in chat was not available as a downloadable file; the supporting section uses a documented Lincoln Park photograph from the official site instead.

Edit `src/brand.json` to change local images, alt text, or credits. Put assets in `public/brand/` and use relative paths such as `brand/ice-cream.jpg` without a leading slash for GitHub Pages compatibility. Brand imagery must never be associated with fictional flavor cards as if it verified their ingredients or allergens. Official flavor descriptions and fictional nutrition are independently labeled. Real photography establishes neither recipe composition nor nutrition.

## Flavor photographs

Official menu cards now use 45 exact-name photos downloaded from Love Creamery's website, served locally from `public/flavors/`. Apple Cajeta had only a generic placeholder and retains a labeled illustration. Fictional demo flavors also keep illustrations. The photo mapping checks both the official record ID and name, so saved official entries gain their matching photos after updating the app without replacing local nutrition or ingredient edits. A renamed/custom entry does not inherit a misleading photo; unavailable or broken images fall back to illustrations.

Each photograph has alt text and a source link in the detail view; full source URLs and checked dates are in `src/flavorPhotos.json`. `python3 scripts/sync-flavor-photos.py` refreshes exact-name photo matches using the Python standard library (optional development task, never a runtime requirement). See `public/flavors/README.md`. Photography does not verify fictional nutrition, ingredients, allergens, or live stock.
