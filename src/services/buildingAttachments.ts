/** HUMAN Bâtiment private Storage adapter — feature OFF until backend/RLS review.
 * Client uses its authenticated Supabase session; NEVER a privileged key.
 */
import { supabase } from '../lib/supabase';

export const BUILDING_ATTACHMENT_BUCKET='human-building-private';
export const MAX_BUILDING_ATTACHMENTS=5;
export const MAX_BUILDING_ATTACHMENT_BYTES=10*1024*1024;
const MIME_TO_EXTENSION:Record<string,string>={
 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'
};
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STORED_NAME=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|pdf)$/i;

export interface BuildingAttachment {
 name:string;
 created_at:string|null;
}
export function buildingAttachmentFeatureEnabled():boolean {
 return import.meta.env.VITE_HUMAN_BUILDING_PREVIEW==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_API_ENABLED==='true'
  && import.meta.env.VITE_HUMAN_BUILDING_UPLOAD_ENABLED==='true';
}
function assertReady(requestId:string) {
 if(!buildingAttachmentFeatureEnabled())throw Error('PIECES_JOINTES_NON_ACTIVEES');
 if(!UUID.test(requestId))throw Error('DEMANDE_INVALIDE');
}
function validateFile(file:File) {
 const ext=MIME_TO_EXTENSION[file.type];
 if(!ext||file.size<1||file.size>MAX_BUILDING_ATTACHMENT_BYTES)
  throw Error('FORMAT_OU_TAILLE_REFUSES');
 return ext;
}
export async function listBuildingAttachments(requestId:string):Promise<BuildingAttachment[]> {
 assertReady(requestId);
 const {data,error}=await supabase.storage.from(BUILDING_ATTACHMENT_BUCKET)
  .list(requestId,{limit:100,sortBy:{column:'name',order:'asc'}});
 if(error)throw Error('LISTE_PIECES_INDISPONIBLE');
 return (data??[]).filter(item=>STORED_NAME.test(item.name))
  .map(item=>({name:item.name,created_at:item.created_at??null}));
}
export async function uploadBuildingAttachments(requestId:string,files:File[]):Promise<number> {
 assertReady(requestId);
 if(files.length<1||files.length>MAX_BUILDING_ATTACHMENTS)
  throw Error('NOMBRE_PIECES_INVALIDE');
 const exts=files.map(validateFile);
 const existing=await listBuildingAttachments(requestId);
 if(existing.length+files.length>MAX_BUILDING_ATTACHMENTS)
  throw Error('LIMITE_CINQ_PIECES');
 if(typeof crypto==='undefined'||typeof crypto.randomUUID!=='function')
  throw Error('IDENTIFIANT_SECURISE_INDISPONIBLE');
 let uploaded=0;
 for(const [i,file] of files.entries()){
  // An opaque random name avoids exposing original filenames to another user.
  const path=requestId+'/'+crypto.randomUUID()+'.'+exts[i];
  const {error}=await supabase.storage.from(BUILDING_ATTACHMENT_BUCKET)
   .upload(path,file,{upsert:false,cacheControl:'0',contentType:file.type});
  if(error)throw Error('TRANSFERT_PARTIEL_'+uploaded);
  uploaded++;
 }
 return uploaded;
}
export async function downloadBuildingAttachment(requestId:string,name:string):Promise<void> {
 assertReady(requestId);
 if(!STORED_NAME.test(name))throw Error('NOM_PIECE_INVALIDE');
 const {data,error}=await supabase.storage.from(BUILDING_ATTACHMENT_BUCKET)
  .download(requestId+'/'+name);
 if(error||!data)throw Error('LECTURE_PIECE_REFUSEE');
 const objectUrl=URL.createObjectURL(data);
 try {
  const link=document.createElement('a');
  link.href=objectUrl;
  link.download='human-chantier-'+name;
  document.body.append(link);
  link.click();
  link.remove();
 } finally {
  window.setTimeout(()=>URL.revokeObjectURL(objectUrl),30_000);
 }
}
