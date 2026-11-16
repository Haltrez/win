/**
 * Casino geo matching (client-safe).
 * geos entries: '*' = every country, 'DE' = a country, 'CA-ON' = a region,
 * '!US' = explicitly excluded (wins over '*').
 */
export function geoAllowed(geos: string[], country?: string | null, region?: string | null): boolean {
  if (!country) return false;
  const regionKey = region ? (region.includes('-') ? region : `${country}-${region}`) : '';
  if (geos.includes(`!${country}`) || (regionKey && geos.includes(`!${regionKey}`))) return false;
  return geos.includes('*') || geos.includes(country) || Boolean(regionKey && geos.includes(regionKey));
}

/** True when the visitor's country/region is explicitly excluded ('!US'). Applies even when geo filtering is off. */
export function geoExcluded(geos: string[], country?: string | null, region?: string | null): boolean {
  if (!country) return false;
  const regionKey = region ? (region.includes('-') ? region : `${country}-${region}`) : '';
  return geos.includes(`!${country}`) || Boolean(regionKey && geos.includes(`!${regionKey}`));
}
