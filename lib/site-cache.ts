/** Cache tag for everything a school's public website renders on the server (settings, gallery). */
export function siteCacheTag(tenantId: string) {
  return `public-site:${tenantId.toLowerCase()}`;
}
