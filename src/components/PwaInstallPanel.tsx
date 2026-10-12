import {useEffect,useState} from 'react';
interface InstallEvent extends Event {
 prompt:()=>Promise<void>;
 userChoice:Promise<{outcome:'accepted'|'dismissed'}>;
}
export function PwaInstallPanel(){
 const [pending,setPending]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 useEffect(()=>{
   const standalone=window.matchMedia('(display-mode: standalone)');
   const update=()=>setInstalled(standalone.matches);
   const before=(event:Event)=>{event.preventDefault();setPending(event as InstallEvent)};
   const installedNow=()=>{setInstalled(true);setPending(null)};
   update();
   window.addEventListener('beforeinstallprompt',before);
   window.addEventListener('appinstalled',installedNow);
   standalone.addEventListener('change',update);
   return ()=>{
     window.removeEventListener('beforeinstallprompt',before);
     window.removeEventListener('appinstalled',installedNow);
     standalone.removeEventListener('change',update);
   };
 },[]);
 if(installed||!pending)return null;
 return <aside className="pwa-install" aria-label="Installation de HUMAN">
   <span>HUMAN peut être installé sur cet appareil.</span>
   <button className="secondary-button" type="button" onClick={()=>{
     const request=pending;setPending(null);
     void request.prompt().then(()=>request.userChoice).catch(()=>undefined);
   }}>Installer HUMAN</button>
 </aside>;
}
