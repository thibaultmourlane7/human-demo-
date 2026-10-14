/** UI-only gating. Server-side quote, credit reservation and expert checks remain authoritative.
 * The Bâtiment financial workflow is deliberately OFF in existing builds.
 */
export function buildingFinancialJourneyEnabled():boolean {
 return import.meta.env.VITE_HUMAN_BUILDING_PREVIEW==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_API_ENABLED==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_QUOTE_ENABLED==='true';
}
