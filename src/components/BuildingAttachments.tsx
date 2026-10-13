import {useEffect,useState,type ChangeEvent} from 'react';
import {
 buildingAttachmentFeatureEnabled,downloadBuildingAttachment,listBuildingAttachments,
 uploadBuildingAttachments,MAX_BUILDING_ATTACHMENT_BYTES,MAX_BUILDING_ATTACHMENTS,
 type BuildingAttachment
} from '../services/buildingAttachments';

const TYPES=new Set(['image/jpeg','image/png','image/webp','application/pdf']);

/** No signed/public links; listing and download both go through user JWT + Storage RLS. */
export function BuildingAttachments({requestId,canUpload=false,initialFiles=[]}:{
 requestId:string;canUpload?:boolean;initialFiles?:File[];
}) {
 const [items,setItems]=useState<BuildingAttachment[]>([]);
 const [files,setFiles]=useState<File[]>(initialFiles);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false);
 const enabled=buildingAttachmentFeatureEnabled();

 async function reload() {
  const next=await listBuildingAttachments(requestId);
  setItems(next);
  setLoaded(true);
 }
 useEffect(()=>{
  if(!enabled)return;
  let active=true;
  setLoaded(false);
  listBuildingAttachments(requestId).then(data=>{
   if(active){setItems(data);setLoaded(true);}
  }).catch(()=>{
   if(active){setError('Les documents ne sont pas disponibles.');setLoaded(true);}
  });
  return ()=>{active=false;};
 },[enabled,requestId]);

 function chooseFiles(event:ChangeEvent<HTMLInputElement>){
  const chosen=Array.from(event.target.files??[]);
  event.target.value='';
  setNotice(null);
  if(chosen.length>MAX_BUILDING_ATTACHMENTS||chosen.some(f=>
   !TYPES.has(f.type)||f.size<1||f.size>MAX_BUILDING_ATTACHMENT_BYTES)){
   setFiles([]);
   setError('Cinq fichiers maximum : JPG, PNG, WebP ou PDF de 10 Mio chacun.');
   return;
  }
  setFiles(chosen);
  setError(null);
 }
 async function upload(){
  if(busy||!canUpload||!files.length)return;
  setBusy(true);setError(null);setNotice(null);
  try{
   const uploaded=await uploadBuildingAttachments(requestId,files);
   setNotice(uploaded+' fichier(s) ajouté(s) au dossier privé.');
   setFiles([]);
  }catch(err){
   const message=err instanceof Error?err.message:'';
   setError(message.startsWith('TRANSFERT_PARTIEL_')
    ? 'Transfert interrompu. Certains fichiers ont été reçus. Vérifiez la liste avant de recommencer.'
    : 'Ajout refusé : vérifiez le nombre, les droits et la disponibilité du service.');
  }finally{
   try{await reload();}catch{setError('Impossible d’actualiser la liste des pièces jointes.');}
   setBusy(false);
  }
 }
 async function download(name:string){
  setError(null);
  try{await downloadBuildingAttachment(requestId,name);}
  catch{setError('Téléchargement refusé ou document indisponible.');}
 }
 if(!enabled)return null;
 return <section className="building-attachments" aria-label="Documents confidentiels du chantier">
   <h3>Documents du chantier</h3>
   <p className="muted">Photos et PDF privés, visibles uniquement par les personnes habilitées.
    Aucun accès public ni stockage hors connexion.</p>
   {!loaded&&<p role="status">Chargement des documents…</p>}
   {loaded&&<ul className="building-attachment-list">
     {items.map((item,index)=><li key={item.name}>
       <span>Pièce n°{index+1} ({item.name.endsWith('.pdf')?'PDF':'image'})</span>
       <button className="secondary-button" type="button" onClick={()=>void download(item.name)}>Télécharger</button>
     </li>)}
   </ul>}
   {loaded&&items.length===0&&<p className="muted">Aucune pièce jointe.</p>}
   {canUpload&&<div className="building-attachments-add">
    <label>Ajouter des pièces (5 par mission maximum)
     <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple
      onChange={chooseFiles} disabled={busy||items.length>=MAX_BUILDING_ATTACHMENTS} />
    </label>
    {files.length>0&&<p className="muted">{files.length} fichier(s) sélectionné(s), non envoyé(s).</p>}
    <button className="secondary-button" type="button" onClick={()=>void upload()}
     disabled={busy||files.length===0||files.length+items.length>MAX_BUILDING_ATTACHMENTS}>
     {busy?'Envoi en cours…':'Ajouter au dossier privé'}
    </button>
   </div>}
   {notice&&<p role="status">{notice}</p>}
   {error&&<p role="alert" className="error-banner">{error}</p>}
 </section>;
}
