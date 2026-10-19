import metadata from "./flavorPhotos.json";
import type { Flavor } from "./logic";
export type FlavorPhoto = {
  name: string;
  path: string;
  alt: string;
  source: string;
  listingSource: string;
  checked: string;
};
export const flavorPhotos: Readonly<Record<string, FlavorPhoto>> = metadata;
function normalized(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("en-US")
    .replaceAll("’", "'")
    .replace(/\s+/g, " ");
}
export function getFlavorPhoto(
  flavor: Pick<Flavor, "id" | "name" | "demo">,
): FlavorPhoto | undefined {
  if (flavor.demo || !Object.hasOwn(flavorPhotos, flavor.id)) return undefined;
  const photo = flavorPhotos[flavor.id];
  return normalized(photo.name) === normalized(flavor.name) ? photo : undefined;
}
