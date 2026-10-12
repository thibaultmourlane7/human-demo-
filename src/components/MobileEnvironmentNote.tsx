import {useState} from 'react';
import {getHumanRuntime} from '../platform/mobileRuntime';
/** Safe to render on both PWA and Capacitor; no new authorizations. */
export function MobileEnvironmentNote(){
 const [runtime]=useState(getHumanRuntime);
 if(runtime==='web')return null;
 return <div className="mobile-environment" role="status">
   Version mobile HUMAN · {runtime==='ios'?'iOS':'Android'} · Connexion nécessaire pour accéder aux missions.
 </div>;
}
