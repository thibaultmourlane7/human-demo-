/** UI reference list only: SQL public.building_trades is authoritative. */
export const BUILDING_TRADES = [
 {code:'roofing',name:'Couverture'},
 {code:'timber',name:'Charpente'},
 {code:'sheet_metal',name:'Zinguerie'},
 {code:'masonry',name:'Maçonnerie et gros œuvre'},
 {code:'plumbing',name:'Plomberie et sanitaire'},
 {code:'heating',name:'Chauffage et ventilation'},
 {code:'electrical',name:'Électricité'},
 {code:'carpentry',name:'Menuiserie'},
 {code:'insulation',name:'Isolation et plâtrerie'},
 {code:'waterproofing',name:'Étanchéité et façades'},
 {code:'earthworks',name:'Terrassement et aménagement extérieur'},
 {code:'diagnostics',name:'Expertise et diagnostic technique'}
] as const;
export type BuildingTradeCode = (typeof BUILDING_TRADES)[number]['code'];
export function buildingExpertWorkflowEnabled() {
 return import.meta.env.VITE_HUMAN_BUILDING_PREVIEW==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_API_ENABLED==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_EXPERT_ENABLED==='true';
}
