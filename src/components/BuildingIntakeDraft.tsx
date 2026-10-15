import {useState,type ChangeEvent,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {createBuildingDraft} from '../services/humanBuildingApi';
import {BuildingAttachments} from './BuildingAttachments';
import {BUILDING_TRADES} from '../features/buildingExperts';

const TRADES=BUILDING_TRADES;

const ALLOWED_TYPES=new Set([
 'image/jpeg','image/png','image/webp','application/pdf',
]);
const MAX_FILE_BYTES=10*1024*1024;
const MAX_FILES=5;

export function BuildingIntakeDraft({session,onSaved}:{session:Session;onSaved?:()=>Promise<void>}) {
 const uploadEnabled=import.meta.env.VITE_HUMAN_BUILDING_UPLOAD_ENABLED==='true';
 const [tradeCode,setTradeCode]=useState('');
 const [question,setQuestion]=useState('');
 const [context,setContext]=useState('');
 const [files,setFiles]=useState<File[]>([]);
 const [prepared,setPrepared]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const [savedId,setSavedId]=useState<string|null>(null);

 function onFiles(event:ChangeEvent<HTMLInputElement>) {
   const selected=Array.from(event.target.files??[]);
   event.target.value='';
   if(selected.length>MAX_FILES || selected.some(file=>
     !ALLOWED_TYPES.has(file.type)||file.size>MAX_FILE_BYTES||file.size===0)){
     setError('Choisissez au maximum cinq photos JPG/PNG/WebP ou PDF de 10 Mo chacun.');
     setFiles([]);setPrepared(false);setSavedId(null);return;
   }
   setError(null);setFiles(selected);setPrepared(false);setSavedId(null);
 }
 async function saveDraft() {
   if(!prepared||!tradeCode||saving)return;
   setSaving(true);setError(null);
   try{
     const receipt=await createBuildingDraft(session,{tradeCode,question:question.trim(),context:context.trim()});
     setSavedId(receipt.request_id);
     if(onSaved) {
       try { await onSaved(); }
       catch { setError('Brouillon enregistré, mais les listes n’ont pas pu être actualisées.'); }
     }
   }catch{
     setError('Impossible d’enregistrer le brouillon. Vérifiez que le service Bâtiment est activé.');
   }finally{setSaving(false);}
 }
 function prepare(event:FormEvent<HTMLFormElement>) {
   event.preventDefault();
   if(!TRADES.some(item=>item.code===tradeCode) || question.trim().length<10
     || question.length>8000 || context.length>10000){
     setError('Précisez le métier et une question de 10 à 8 000 caractères.');
     return;
   }
   setError(null);setPrepared(true);
 }
 return <section className="panel building-intake" aria-label="Préparer une demande d’expert du bâtiment">
   <p className="eyebrow">HUMAN Bâtiment — Aperçu du futur parcours</p>
   <h2>Préparer un dossier de consultation</h2>
   <p className="muted">Décrivez votre demande pour créer un dossier HUMAN Bâtiment. Aucun devis payant ni mise en relation automatique n’est lancé à cette étape.</p>
   <form onSubmit={prepare}>
    <label>Métier concerné
      <select required disabled={saving} value={tradeCode} onChange={event=>{setTradeCode(event.target.value);setPrepared(false);setSavedId(null)}}>
        <option value="">Choisir un métier</option>
        {TRADES.map(trade=><option key={trade.code} value={trade.code}>{trade.name}</option>)}
      </select>
    </label>
    <label>Question technique
      <textarea disabled={saving} value={question} minLength={10} maxLength={8000} rows={4} required
       onChange={event=>{setQuestion(event.target.value);setPrepared(false);setSavedId(null)}}
       placeholder="Décrivez les symptômes, dimensions, matériaux, contexte du chantier…" />
    </label>
    <label>Contexte du chantier
      <textarea disabled={saving} value={context} maxLength={10000} rows={3}
       onChange={event=>{setContext(event.target.value);setPrepared(false);setSavedId(null)}}
       placeholder="Nature des travaux, âge du bâtiment, contraintes connues…" />
    </label>
    <label>Photos et PDF (facultatif — ${uploadEnabled?'à joindre après enregistrement':'sélection locale uniquement'})
      <input disabled={saving||!!savedId} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple
       onChange={onFiles} aria-describedby="building-attachments-hint" />
    </label>
    <p className="muted" id="building-attachments-hint">Jusqu’à cinq fichiers de 10 Mo. ${uploadEnabled
      ? 'Après enregistrement du dossier, vous pourrez les transférer séparément dans l’espace sécurisé.'
      : 'Le transfert des pièces jointes n’est pas encore activé : les fichiers sélectionnés resteront uniquement sur cet appareil et ne feront pas partie du dossier enregistré.'}</p>
    {files.length>0&&<ul>{files.map((file,index)=><li key={index}>{file.name} — {file.size<1048576?(file.size/1024).toFixed(0)+' Ko':(file.size/1048576).toFixed(1)+' Mo'}</li>)}</ul>}
    {error&&<p role="alert" className="error-banner">{error}</p>}
    <button className="secondary-button" type="submit">Vérifier le brouillon</button>
    {prepared&&<p role="status" className="building-intake-ready">
       Brouillon local prêt. La mise en relation reste impossible avant la validation du devis.</p>}
    {prepared && import.meta.env.VITE_HUMAN_BUILDING_API_ENABLED === 'true' &&
      <button className="secondary-button" type="button" disabled={saving||!!savedId}
       onClick={()=>void saveDraft()}>
       {saving?'Enregistrement…':'Enregistrer le dossier (sans fichiers)'}
      </button>}
    {savedId&&<p role="status" className="building-intake-ready">
      Brouillon enregistré sous la référence {savedId}. Aucun transfert automatique, aucun expert contacté, aucun crédit débité.
    </p>}
    {savedId&&files.length>0&&!uploadEnabled&&<p className="notice" role="status">Les {files.length} pièce(s) sélectionnée(s) ne sont pas enregistrée(s) avec ce dossier. Conservez-les sur votre appareil jusqu’à l’activation de l’envoi sécurisé.</p>}
    {savedId&&<BuildingAttachments key={savedId} requestId={savedId} canUpload initialFiles={files} />}
   </form>
 </section>;
}
