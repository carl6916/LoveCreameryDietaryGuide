import { useState } from "react";
import type { Flavor } from "./logic";
import { getFlavorPhoto } from "./flavorPhotos";
export function FlavorImage({ flavor }: { flavor: Flavor }) {
  const photo = getFlavorPhoto(flavor);
  const [failedPath, setFailedPath] = useState<string>();
  const showPhoto = photo && failedPath !== photo.path;
  return (
    <figure className="flavor-visual">
      <div
        className={`flavor-art${showPhoto ? " has-photo" : ""}`}
        style={{ background: flavor.color + "30" }}
      >
        {showPhoto ? (
          <img
            className="flavor-photo"
            src={photo.path}
            alt={photo.alt}
            width="500"
            height="500"
            loading="lazy"
            decoding="async"
            onError={() => setFailedPath(photo.path)}
          />
        ) : (
          <div
            style={{ background: flavor.color }}
            className="mini-scoop"
            aria-hidden="true"
          />
        )}
        <span>{flavor.demo ? "DEMONSTRATION" : "OFFICIAL MENU LISTING"}</span>
      </div>
      <figcaption>
        {showPhoto ? (
          <>
            <a href={photo.source}>Photo: Love Creamery’s website ↗</a>
          </>
        ) : flavor.demo ? (
          "Illustration for a fictional flavor"
        ) : (
          "Illustration — official flavor photo unavailable"
        )}
      </figcaption>
    </figure>
  );
}
