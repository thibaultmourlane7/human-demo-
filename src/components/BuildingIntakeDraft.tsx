import {useState,type ChangeEvent,type FormEvent} from 'react';

/** UI catalogue only. The server-side trade catalogue remains authoritative. */
const TRADES=[
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
 {code:'diagnostics',name:'Expertise et diagnostic technique'},
] as const;

const ALLOWED_TYPES=new Set([
 'image/jpeg','image/png','image/webp','application/pdf',
]);
const MAX_FILE_BYTES=10*1024*1024;
const MAX_FILES=5;

export function BuildingIntakeDraft() {
 const [tradeCode,setTradeCode]=useState('');
 const [question,setQuestion]=useState('');
 const [context,setContext]=useState('');
 const [files,setFiles]=useState<File[]>([]);
 const [prepared,setPrepared]=useState(false);
 const [error,setError]=useState<string|null>(null);

 function onFiles(event:ChangeEvent<HTMLInputElement>) {
   const selected=Array.from(event.target.files??[]);
   event.target.value='';
   if(selected.length>MAX_FILES || selected.some(file=>
     !ALLOWED_TYPES.has(file.type)||file.size>MAX_FILE_BYTES||file.size===0)){
     setError('Choisissez au maximum cinq photos JPG/PNG/WebP ou PDF de 10 Mo chacun.');
     setFiles([]);setPrepared(false);return;
   }
   setError(null);setFiles(selected);setPrepared(false);
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
   <p className="muted">Ce formulaire prépare uniquement le dossier dans votre navigateur.
   Aucun envoi, aucune sauvegarde, aucune mise en relation ni dépense n’est possible ici.</p>
   <form onSubmit={prepare}>
    <label>Métier concerné
      <select required value={tradeCode} onChange={event=>{setTradeCode(event.target.value);setPrepared(false)}}>
        <option value="">Choisir un métier</option>
        {TRADES.map(trade=><option key={trade.code} value={trade.code}>{trade.name}</option>)}
      </select>
    </label>
    <label>Question technique
      <textarea value={question} minLength={10} maxLength={8000} rows={4} required
       onChange={event=>{setQuestion(event.target.value);setPrepared(false)}}
       placeholder="Décrivez les symptômes, dimensions, matériaux, contexte du chantier…" />
    </label>
    <label>Contexte du chantier
      <textarea value={context} maxLength={10000} rows={3}
       onChange={event=>{setContext(event.target.value);setPrepared(false)}}
       placeholder="Nature des travaux, âge du bâtiment, contraintes connues…" />
    </label>
    <label>Photos et PDF (facultatif, conservation locale uniquement)
      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple
       onChange={onFiles} aria-describedby="building-attachments-hint" />
    </label>
    <p className="muted" id="building-attachments-hint">Jusqu'à cinq fichiers de 10 Mo.
     Les fichiers ne sont ni envoyés ni conservés par HUMAN à cette étape.</p>
    {files.length>0&&<ul>{files.map((file,index)=><li key={index}>{file.name} — {(file.size/1048576).toFixed(1)} Mo</li>)}</ul>}
    {error&&<p role="alert" className="error-banner">{error}</p>}
    <button className="secondary-button" type="submit">Vérifier le brouillon</button>
    {prepared&&<p role="status" className="building-intake-ready">
       Brouillon local prêt. La transmission à un expert sera disponible seulement
       après activation sécurisée du parcours Bâtiment et validation du devis.</p>}
   </form>
 </section>;
}
