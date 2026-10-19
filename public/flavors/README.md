# Official flavor photographs

These are unmodified images downloaded from Love Creamery's official flavor menu, https://www.lovecreamery.com/ice-cream-flavors/ . Each file is matched to an exact flavor name, rather than guessed from its appearance. Original URLs, official names, and retrieval dates are recorded in `src/flavorPhotos.json`. Images retain their original ownership; the prototype does not claim to have photographed them or to be endorsed by the shop.

45 of the 46 researched flavors had a matching photograph on the page when checked on October 19, 2026. Apple Cajeta had a generic site placeholder rather than a photograph, so it keeps an explicitly labeled illustration. The shipped catalog contains only researched shop flavor listings. Customer catalog editing and browser-saved overrides are not used.

The app serves all photos locally. Refresh them with `python3 scripts/sync-flavor-photos.py` from a development machine with access to the official website; Python standard library only. Inspect its results and commit the assets and metadata together. The normal install, build, and runtime do not contact the shop website.

Photographs do not verify current stock, nutrition, ingredient lists, allergen absence, or cross-contact conditions. The nutrition disclaimer and ingredient provenance remain independent of these images.
