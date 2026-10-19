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

Choose Canal Park, Lincoln Park, or Billings Park, select any combination of restrictions, then click **Find My Flavors**. Change location by selecting another shop and searching again. Reset clears restrictions. Results explicitly separate matches, missing information, and conflicts. Cards document ingredients, each allergen, provenance, verification, season, and availability. An unknown availability value never establishes current stock.

The question guide uses local keywords, synonyms, full flavor names, store names, and the same classification function as filtering. It can report ingredients or allergen status and describe why entries match. “Ask about this flavor” selects context. The guide lists conflicts and unknowns explicitly alongside matches; do not interpret every returned entry as a recommendation. Unsupported questions prompt supported examples. It cannot interpret every phrase, discover information, or check live inventory.

## Data and safety

All bundled flavors are **fictional demonstration data**, not verified Love Creamery products. The initial catalog was created while the official website was unavailable. Later access to brand imagery has not independently verified any real recipe, allergen status, or stock. Absence values in demonstrations refer only to fictional recipes. Reference resources: https://lovecreamery.com/ice-cream-flavors/ and https://lovecreamery.com/faqs/ .

Love Creamery is not an allergen-free facility; cross-contact may occur. A recipe match is never a guarantee of allergy safety. Vegan is independent of milk allergen status. Gluten-free does not establish protection from cross-contact. Unknown is not absence. Customers with serious allergies must confirm ingredients and preparation practices directly with the shop.

## Manage the catalog

Open **Manage catalog** to add, edit, archive, restore, or delete flavors. Every allergen has an explicit Contains / Not listed as an ingredient (verified) / Unknown value. Set independent vegan and gluten-free values. Real entries require a source and verification date; editors are responsible for accurate evidence. Dates are not automatically refreshed or independently verified by the application.

Changes are saved under `love-creamery-catalog-v1` in browser localStorage. They persist after refresh only in that browser and origin. Storage can be cleared or unavailable; save failures are displayed. There is no secure administrator authentication and no shared multi-user publishing. Export JSON for backups; import validates the full schema and asks before replacing the browser catalog. Imported real data is user supplied, not independently authenticated. Do not store confidential information.

For shared defaults, update `src/catalog.json` and redeploy the built static site. Locations are editable in `src/locations.json`; import validation reads the location IDs from the same file. The default catalog and application use no external runtime requests, images, or fonts. All illustrations are CSS.

## Automated browser checks

With the dev server running, run `npx playwright install chromium` once, then `npm run test:browser` in another terminal. On this cloud machine, Chromium is already installed: use `BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser`. Set `TEST_BASE_URL` to test another server or the production preview. The test uses an isolated browser profile and covers filters, locations, ingredient questions, CRUD, refresh persistence, export/import, invalid imports, and mobile overflow. It writes screenshots to the operating system temporary directory. Browser tests need Chromium only during development, never for application users.

## Manual acceptance checks

- Choose each location and search; confirm only associated, nonarchived entries appear.
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

Edit `src/brand.json` to change local images, alt text, or credits. Put assets in `public/brand/` and use relative paths such as `brand/ice-cream.jpg` without a leading slash for GitHub Pages compatibility. Brand imagery must never be associated with fictional flavor cards as if it verified their ingredients or allergens. The bundled flavor catalog remains entirely fictional.
