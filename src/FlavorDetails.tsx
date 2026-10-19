import React, { useEffect, useRef } from "react";
import { classify, allergens, type Flavor, type Need } from "./logic";
import locations from "./locations.json";
import { FlavorImage } from "./FlavorImage";
import { NutritionPanel } from "./Nutrition";
const statusLabels = {
  contains: "Contains",
  absent: "Not listed as an ingredient (verified)",
  unknown: "Unknown",
};
export function FlavorDetails({
  flavor,
  needs,
  onClose,
  onAsk,
}: {
  flavor: Flavor;
  needs: Need[];
  onClose: () => void;
  onAsk: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  function close() {
    ref.current?.close();
    onClose();
  }
  return (
    <dialog
      ref={ref}
      className="flavor-dialog"
      aria-labelledby="flavor-detail-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="detail-header">
        <h2 id="flavor-detail-title">{flavor.name}</h2>
        <button type="button" aria-label="Close flavor details" onClick={close}>
          Close ✕
        </button>
      </div>
      <div className="detail-content">
        <FlavorImage flavor={flavor} />
        <p>{flavor.description}</p>
        <section className="detail-locations" aria-label="Store locations">
          <h3>Store locations</h3>
          <ul>
            {locations
              .filter((l) => flavor.locations.includes(l.id))
              .map((l) => (
                <li key={l.id}>
                  <strong>{l.name}</strong>
                  <span>{l.city}</span>
                </li>
              ))}
          </ul>
          {!flavor.locations.length && <p>No locations documented.</p>}
          <p>
            These are catalog associations. Current stock is{" "}
            {flavor.availability === "unknown"
              ? "unconfirmed"
              : `${flavor.availability} according to the saved catalog; confirm with the shop`}
            .
          </p>
        </section>
        <section aria-label="Dietary and allergy information">
          <h3>Dietary & allergy information</h3>
          <p className="detail-classification">
            {needs.length
              ? `For your selected restrictions: ${classify(flavor, needs)}`
              : "No dietary restrictions selected."}
          </p>
          <div className="badges">
            <span>Vegan: {flavor.vegan}</span>
            <span>Gluten-free: {flavor.glutenFree}</span>
          </div>
          <dl className="detail-allergens">
            {allergens.map((a) => (
              <React.Fragment key={a}>
                <dt>{a === "milk" ? "Dairy / milk" : a}</dt>
                <dd>{statusLabels[flavor.allergens[a]]}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="detail-allergy-warning">
            <strong>Cross-contact may occur.</strong> Love Creamery is not an
            allergen-free facility. Vegan and gluten-free labels do not
            guarantee allergy safety. Confirm ingredients and preparation
            practices directly with the shop.
          </p>
          {flavor.demo && (
            <p className="detail-fictional-note">
              <strong>Fictional demonstration flavor.</strong> Recipe and
              allergen values do not describe a verified Love Creamery product.
            </p>
          )}
        </section>
        <NutritionPanel flavor={flavor} expanded />
        <section className="detail-provenance">
          <h3>Ingredients & source</h3>
          <p>
            <strong>Ingredients:</strong> {flavor.ingredients}
          </p>
          <p>
            <strong>Season:</strong> {flavor.season}
            <br />
            <strong>Listing checked:</strong>{" "}
            {flavor.verified || "Not verified — demonstration"}
            <br />
            <strong>Source:</strong> {flavor.source}
          </p>
        </section>
        <button
          className="primary"
          type="button"
          onClick={() => {
            ref.current?.close();
            onAsk();
          }}
        >
          Ask about this flavor →
        </button>
      </div>
    </dialog>
  );
}
